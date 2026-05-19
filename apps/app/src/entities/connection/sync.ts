import type { ORPCOutputs } from '~/lib/orpc'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { createCollection } from '@tanstack/react-db'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { db, waitForMigrations } from '~/drizzle'
import { connections, connectionsResources } from '~/drizzle/schema'
import { isSignedIn } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

function prepareConnectionStringToCloud(connectionString: string, syncType: SyncType) {
  const url = new SafeURL(connectionString.trim())
  if (syncType !== SyncType.Cloud) {
    url.password = ''
  }
  return url.toString()
}

export interface ConnectionMutationMetadata {
  cloudSync?: false
}

export const connectionsCollection = createCollection(drizzleCollectionOptions({
  db,
  table: connections,
  primaryColumn: connections.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: {
    sync: async ({ writeAsync, collection, markReady }) => {
      if (!navigator.onLine || !await isSignedIn()) {
        return
      }

      const abortController = new AbortController()

      const events = await orpc.connections.events.call({}, {
        signal: abortController.signal,
      })

      const writeItem = async (item: ORPCOutputs['connections']['sync'][number]) => {
        if (item.type === 'insert') {
          await writeAsync({
            type: 'insert',
            value: {
              ...item.value,
              isPasswordPopulated: !!new SafeURL(item.value.connectionString).password,
            },
          })
        }
        else if (item.type === 'update') {
          const existed = collection.get(item.value.id)

          if (!existed) {
            throw new Error('Entity not found')
          }

          const cloudPassword = new SafeURL(item.value.connectionString).password
          const localPassword = new SafeURL(existed.connectionString).password
          const newConnectionString = new SafeURL(item.value.connectionString)

          if (item.value.syncType === SyncType.CloudWithoutPassword && localPassword && !cloudPassword) {
            newConnectionString.password = localPassword
          }

          await writeAsync({
            type: 'update',
            value: {
              ...item.value,
              connectionString: newConnectionString.toString(),
              isPasswordPopulated: !!newConnectionString.password,
              syncType: item.value.syncType ?? SyncType.CloudWithoutPassword,
            },
          })
        }
        else if (item.type === 'delete') {
          await writeAsync({
            type: 'delete',
            key: item.key,
          })
        }
      }

      ;(async () => {
        for await (const item of events) {
          writeItem(item)
        }
      })()

      const sync = await orpc.connections.sync.call(
        await db.select({ id: connections.id, updatedAt: connections.updatedAt }).from(connections),
        { signal: abortController.signal },
      )

      for (const item of sync) {
        await writeItem(item)
      }

      markReady()

      return () => {
        try {
          abortController.abort()
        }
        catch {}
      }
    },
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.create.call({
      ...m.modified,
      connectionString: prepareConnectionStringToCloud(m.modified.connectionString, m.modified.syncType),
    })))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.update.call({
      id: m.key,
      ...m.changes,
      ...(m.changes.connectionString
        ? { connectionString: prepareConnectionStringToCloud(m.changes.connectionString, m.modified.syncType) }
        : {}),
    })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.connections.remove.call(mutations.map(m => ({ id: m.key })))
  },
}))

export interface ConnectionResourcesMutationMetadata {
  cloudSync?: false
}

export const connectionsResourcesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: connectionsResources,
  primaryColumn: connectionsResources.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: {
    sync: async ({ writeAsync, markReady }) => {
      if (!navigator.onLine || !await isSignedIn()) {
        return
      }

      await connectionsCollection.stateWhenReady()

      const abortController = new AbortController()

      const events = await orpc.connectionsResources.events.call({}, {
        signal: abortController.signal,
      })

      ;(async () => {
        for await (const item of events) {
          await writeAsync(item)
        }
      })()

      const sync = await orpc.connectionsResources.sync.call(
        await db.select({ id: connectionsResources.id, updatedAt: connectionsResources.updatedAt }).from(connectionsResources),
        { signal: abortController.signal },
      )

      for (const item of sync) {
        await writeAsync(item)
      }

      markReady()

      return () => {
        try {
          abortController.abort()
        }
        catch {}
      }
    },
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connectionsResources.create.call(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.connectionsResources.remove.call(mutations.map(m => ({ id: m.key })))
  },
}))
