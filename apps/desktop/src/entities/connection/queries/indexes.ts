import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { indexesQuery } from '../sql/index'

export function connectionIndexesQuery({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'indexes'],
    queryFn: () => indexesQuery(connection),
  })
}

export function useConnectionIndexes(...params: Parameters<typeof connectionIndexesQuery>) {
  return useQuery(connectionIndexesQuery(...params))
}
