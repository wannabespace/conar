import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { enumsQuery } from '../sql/enums'

export function connectionEnumsQuery({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'enums'],
    queryFn: () => enumsQuery(connection),
  })
}

export function useConnectionEnums(...params: Parameters<typeof connectionEnumsQuery>) {
  return useQuery(connectionEnumsQuery(...params))
}
