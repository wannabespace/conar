import type { MutationOptions } from '@tanstack/react-query'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { databases, db, waitForMigrations } from '~/drizzle'
import { bearerToken } from '~/lib/auth'
import { drizzleCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'
import { router } from '~/main'

const { promise, resolve } = Promise.withResolvers()

export function waitForDatabasesSync() {
  return promise
}

export const databasesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: databases,
  primaryColumn: databases.id,
  startSync: false,
  sync: {
    prepare: waitForMigrations,
    sync: async ({ write, collection }) => {
      if (!bearerToken.get() || !navigator.onLine) {
        return
      }

      const sync = await orpc.databases.sync(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

      for (const item of sync) {
        if (item.type === 'insert') {
          write({
            type: 'insert',
            value: {
              ...item.value,
              isPasswordPopulated: !!new SafeURL(item.value.connectionString).password,
              syncType: item.value.syncType ?? SyncType.CloudWithoutPassword,
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

          // TODO: change to sync type
          if (item.value.isPasswordExists && localPassword && !cloudPassword) {
            newConnectionString.password = localPassword
          }

          const connectionString = newConnectionString.toString()
          const isPasswordPopulated = !!new SafeURL(item.value.connectionString).password

          write({
            type: 'update',
            value: {
              ...item.value,
              connectionString,
              isPasswordPopulated,
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
      resolve()
    },
  },
  onInsert: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map((m) => {
      if (m.changes.name) {
        const url = new SafeURL(m.modified.connectionString.trim())

        const isPasswordExists = !!url.password

        if (isPasswordExists && m.modified.syncType !== SyncType.Cloud) {
          url.password = ''
        }

        return orpc.databases.create({
          ...m.modified,
          connectionString: url.toString(),
          isPasswordExists,
          syncType: m.modified.syncType,
        })
      }

      return Promise.resolve()
    }))
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map((m) => {
      if (m.changes.name) {
        return orpc.databases.update({
          id: m.key,
          name: m.changes.name,
        })
      }

      return Promise.resolve()
    }))
    router.invalidate({ filter: r => r.routeId === '/(protected)/_protected/database/$id' })
  },
  onDelete: async ({ transaction }) => {
    await orpc.databases.remove(transaction.mutations.map(m => ({ id: m.key })))
  },
}))

const syncDatabasesMutationOptions = {
  mutationKey: ['sync-databases'],
  mutationFn: databasesCollection.utils.runSync,
  onError: () => {},
} satisfies MutationOptions

export function useDatabasesSync() {
  const { mutate } = useMutation(syncDatabasesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncDatabasesMutationOptions) > 0,
  }
}
