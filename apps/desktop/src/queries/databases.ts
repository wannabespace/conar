import type { QueryOptions } from '@tanstack/react-query'
import { trpc } from '~/lib/trpc'

export function databasesQuery() {
  return {
    queryKey: ['databases', 'list'],
    queryFn: () => trpc.databases.list.query(),
  } satisfies QueryOptions
}
