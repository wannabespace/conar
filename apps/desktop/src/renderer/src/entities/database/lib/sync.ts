import type { MutationOptions } from '@tanstack/react-query'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { databases } from '~/drizzle'
import { pgLiteCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

export const databasesCollection = createCollection(pgLiteCollectionOptions({
  table: databases,
  getPrimaryColumn: databases => databases.id,
  onUpdate: async (params) => {
    await Promise.all(params.transaction.mutations.map((m) => {
      if (m.changes.name) {
        return orpc.databases.update({
          id: m.key,
          name: m.modified.name,
        })
      }

      return Promise.resolve()
    }))
  },
  onDelete: async (params) => {
    await Promise.all(params.transaction.mutations.map(m => orpc.databases.remove({ id: m.key })))
  },
}))

async function syncDatabases() {
  const existing = databasesCollection.toArray
  const iterator = await orpc.sync.databases(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    // Temporary only one event
    if (event.type === 'sync') {
      event.data.forEach((item) => {
        if (item.type === 'insert') {
          databasesCollection.insert({
            ...item.value,
            isPasswordPopulated: !!new SafeURL(item.value.connectionString).password,
          })
        }
        else if (item.type === 'update') {
          databasesCollection.update(item.value.id, (draft) => {
            const { connectionString, ...value } = item.value

            Object.assign(draft, value)

            const cloudPassword = new SafeURL(connectionString).password
            const localPassword = new SafeURL(draft.connectionString).password
            const newConnectionString = new SafeURL(connectionString)

            if (cloudPassword) {
              newConnectionString.password = cloudPassword
            }
            else if (draft.isPasswordExists && localPassword) {
              newConnectionString.password = localPassword
            }

            draft.connectionString = newConnectionString.toString()
            draft.isPasswordPopulated = !!new SafeURL(draft.connectionString).password
          })
        }
        else if (item.type === 'delete') {
          databasesCollection.delete(item.value)
        }
      })
    }
  }
}

const syncDatabasesMutationOptions = {
  mutationKey: ['sync-databases'],
  mutationFn: syncDatabases,
} satisfies MutationOptions

export function useDatabasesSync() {
  const { mutate } = useMutation(syncDatabasesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncDatabasesMutationOptions) > 0,
  }
}
