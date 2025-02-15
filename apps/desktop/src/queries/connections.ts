import type { QueryOptions } from '@tanstack/react-query'
import { trpc } from '~/lib/trpc'

export function connectionsQuery() {
  return {
    queryKey: ['connections', 'list'],
    queryFn: () => trpc.connections.list.query(),
  } satisfies QueryOptions
}

export function connectionQuery(id: string) {
  return {
    queryKey: ['connections', 'list', id],
    queryFn: () => trpc.connections.get.query({ id }),
  } satisfies QueryOptions
}
