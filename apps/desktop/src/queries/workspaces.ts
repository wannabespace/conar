import { queryOptions } from '@tanstack/react-query'
import { trpc } from '~/trpc'

export function workspacesQuery() {
  return queryOptions({
    queryKey: ['workspaces', 'list'],
    queryFn: () => trpc.workspaces.list.query(),
  })
}
