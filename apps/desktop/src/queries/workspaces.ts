import type { QueryOptions } from '@tanstack/react-query'
import { trpc } from '~/lib/trpc'

export function workspacesQuery() {
  return {
    queryKey: ['workspaces', 'list'],
    queryFn: () => trpc.workspaces.list.query(),
  } satisfies QueryOptions
}
