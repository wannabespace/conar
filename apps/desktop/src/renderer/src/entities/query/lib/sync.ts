import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { queries } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database'
import { pgLiteCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection(pgLiteCollectionOptions({
  table: queries,
  getPrimaryColumn: queries => queries.id,
}))

async function syncQueries() {
  await waitForDatabasesSync()
  const existing = await queriesCollection.toArrayWhenReady()
  const iterator = await orpc.sync.queries(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    if (import.meta.env.DEV) {
      console.log('syncQueries event', event)
    }

    if (event.type === 'sync') {
      event.value.forEach((item) => {
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
    else if (event.type === 'insert') {
      queriesCollection.insert(event.value)
    }
    else if (event.type === 'update') {
      queriesCollection.update(event.value.id, (draft) => {
        Object.assign(draft, event.value)
      })
    }
    else if (event.type === 'delete') {
      queriesCollection.delete(event.value)
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
