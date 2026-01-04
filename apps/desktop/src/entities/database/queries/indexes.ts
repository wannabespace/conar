import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { indexesQuery } from '../sql/index'

export function databaseIndexesQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'indexes'],
    queryFn: () => indexesQuery.run(database),
  })
}

export function useDatabaseIndexes(...params: Parameters<typeof databaseIndexesQuery>) {
  return useQuery(databaseIndexesQuery(...params))
}
