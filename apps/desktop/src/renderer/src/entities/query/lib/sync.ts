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
  const sync = await orpc.queries.sync(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  sync.forEach((item) => {
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
