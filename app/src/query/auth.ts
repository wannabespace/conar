import { queryOptions } from '@tanstack/react-query'
import { authClient } from '~/lib/auth'

export function sessionQuery() {
  return queryOptions({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(),
  })
}
