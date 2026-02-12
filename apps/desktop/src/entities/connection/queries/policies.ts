import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { policiesQuery } from '../sql/policies'

export function connectionPoliciesQuery({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'policies'],
    queryFn: () => policiesQuery(connection),
  })
}

export function useConnectionPolicies(...params: Parameters<typeof connectionPoliciesQuery>) {
  return useQuery(connectionPoliciesQuery(...params))
}
