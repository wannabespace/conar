import type { MutationOptions } from '@tanstack/react-query'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { connections, db, waitForMigrations } from '~/drizzle'
import { bearerToken } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { router } from '~/main'

let resolvers = Promise.withResolvers()

export function waitForConnectionsSync() {
  return resolvers.promise
}

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
    if (!bearerToken.get() || !navigator.onLine) {
      return
    }

    resolvers = Promise.withResolvers()

    const sync = await orpc.connections.sync(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

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
    resolvers.resolve()
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.create({
      ...m.modified,
      connectionString: prepareConnectionStringToCloud(m.modified.connectionString, m.modified.syncType),
    })))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.update({
      id: m.key,
      ...m.changes,
      ...(m.changes.connectionString
        ? { connectionString: prepareConnectionStringToCloud(m.changes.connectionString, m.modified.syncType) }
        : {}),
    })))
    router.invalidate({ filter: r => r.routeId === '/_protected/database/$id' })
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.connections.remove(mutations.map(m => ({ id: m.key })))
  },
}))

const syncConnectionsMutationOptions = {
  mutationKey: ['sync-connections'],
  mutationFn: connectionsCollection.utils.runSync,
} satisfies MutationOptions

export function useConnectionsSync() {
  const { mutate } = useMutation(syncConnectionsMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncConnectionsMutationOptions) > 0,
  }
}
