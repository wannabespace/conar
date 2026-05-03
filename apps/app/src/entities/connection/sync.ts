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
  sync: async ({ write, collection }) => {
    if (!navigator.onLine || !await isSignedIn()) {
      return
    }

    const sync = await orpc.connections.sync.call(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    for (const item of sync) {
      if (item.type === 'insert') {
        write({
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

        write({
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
        const existed = collection.get(item.value)

        if (!existed) {
          throw new Error('Entity not found')
        }

        write({
          type: 'delete',
          value: existed,
        })
      }
    }
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
  sync: async ({ collection, write }) => {
    if (!navigator.onLine || !await isSignedIn()) {
      return
    }

    await connectionsCollection.utils.waitForSync()
    const sync = await orpc.connectionsResources.sync.call(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        write(item)
      }
    })
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
