import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { eq, inArray } from 'drizzle-orm'
import { db, queries, queriesSelectSchema } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection({
  startSync: true,
  sync: {
    sync: async ({ begin, write, commit, markReady }) => {
      begin()
      const qs = await db.select().from(queries)
      qs.forEach(q => write({ type: 'insert', value: q }))
      commit()
      markReady()
    },
  },
  schema: queriesSelectSchema,
  getKey: query => query.id,
  onDelete: async ({ transaction }) => {
    const keys = transaction.mutations.map(mutation => mutation.key)
    if (keys.length > 0) {
      await db.delete(queries).where(inArray(queries.id, keys))
    }
  },
  onInsert: async ({ transaction }) => {
    await db.insert(queries).values(transaction.mutations.map(m => m.modified))
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(mutation =>
      db.update(queries).set(mutation.changes).where(eq(queries.id, mutation.key)),
    ))
  },
})

async function syncQueries() {
  const existing = queriesCollection.toArray
  const iterator = await orpc.sync.queries(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    // Temporary only one event
    if (event.type === 'sync') {
      event.data.forEach((item) => {
        if (item.type === 'insert') {
          queriesCollection.insert(item.value)
        }
        else if (item.type === 'update') {
          queriesCollection.update(item.value.id, (draft) => {
            Object.assign(draft, item.value)
          })
        }
        else if (item.type === 'delete') {
          queriesCollection.delete(item.value)
        }
      })
    }
  }
}

const syncQueriesMutationOptions = {
  mutationKey: ['sync-queries'],
  mutationFn: syncQueries,
} satisfies MutationOptions

export function useQueriesSync() {
  const { mutate } = useMutation(syncQueriesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncQueriesMutationOptions) > 0,
  }
}
