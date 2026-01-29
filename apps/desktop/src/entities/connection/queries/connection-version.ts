import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { connectionVersionQuery } from '../sql'

export function connectionVersionQueryOptions({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'version'],
    queryFn: () => connectionVersionQuery(connection),
    throwOnError: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}

export function useConnectionVersion(...params: Parameters<typeof connectionVersionQueryOptions>) {
  return useQuery(connectionVersionQueryOptions(...params))
}
