import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { constraintsQuery } from '../sql/constraints'

export function connectionConstraintsQuery({ connection }: { connection: typeof connections.$inferSelect }) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'constraints'],
    queryFn: () => constraintsQuery(connection),
  })
}

export function useConnectionConstraints(...params: Parameters<typeof connectionConstraintsQuery>) {
  return useQuery(connectionConstraintsQuery(...params))
}
