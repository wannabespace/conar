import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { db, queries, waitForMigrations } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database'
import { bearerToken } from '~/lib/auth'
import { drizzleCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: queries,
  primaryColumn: queries.id,
  sync: {
    startSync: false,
    beforeSync: waitForMigrations,
    sync: async ({ collection, write }) => {
      if (!bearerToken.get() || !navigator.onLine) {
        return
      }

      await waitForDatabasesSync()
      const sync = await orpc.queries.sync(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

      sync.forEach((item) => {
        if (item.type === 'delete') {
          write({ type: 'delete', value: collection.get(item.value)! })
        }
        else {
          write(item)
        }
      })
    },
  },
  onInsert: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(m => orpc.queries.create(m.modified)))
  },
  onDelete: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(m => orpc.queries.remove({ id: m.key })))
  },
}))

const syncQueriesMutationOptions = {
  mutationKey: ['sync-queries'],
  mutationFn: queriesCollection.utils.runSync,
  onError: () => {},
} satisfies MutationOptions

export function useQueriesSync() {
  const { mutate } = useMutation(syncQueriesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncQueriesMutationOptions) > 0,
  }
}
