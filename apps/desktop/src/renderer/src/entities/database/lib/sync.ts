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
            Object.assign(draft, item.value)

            if (item.value.connectionString) {
              draft.isPasswordPopulated = !!new SafeURL(item.value.connectionString).password
            }
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
