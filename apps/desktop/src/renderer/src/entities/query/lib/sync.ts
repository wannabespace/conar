import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { queries } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database'
import { bearerToken } from '~/lib/auth'
import { pgLiteCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection(pgLiteCollectionOptions({
  startSync: false,
  table: queries,
  getPrimaryColumn: queries => queries.id,
  sync: async ({ collection, write }) => {
    if (!bearerToken.get() || !navigator.onLine) {
      return
    }

    await waitForDatabasesSync()
    const existing = collection.toArray
    const sync = await orpc.queries.sync(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'insert') {
        write({ type: 'insert', value: item.value })
      }
      else if (item.type === 'update') {
        write({ type: 'update', value: item.value })
      }
      else if (item.type === 'delete') {
        const existed = collection.get(item.value)

        if (!existed) {
          throw new Error('Entity not found')
        }

        write({ type: 'delete', value: existed })
      }
    })
  },
  onInsert: async (params) => {
    await Promise.all(params.transaction.mutations.map(m => orpc.queries.create(m.modified)))
  },
  onDelete: async (params) => {
    await Promise.all(params.transaction.mutations.map(m => orpc.queries.remove({ id: m.key })))
  },
}))

const syncQueriesMutationOptions = {
  mutationKey: ['sync-queries'],
  mutationFn: queriesCollection.utils.runSync,
} satisfies MutationOptions

export function useQueriesSync() {
  const { mutate } = useMutation(syncQueriesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncQueriesMutationOptions) > 0,
  }
}
