import type { QueryOptions } from '@tanstack/react-query'
import { authClient } from '~/lib/auth'

export const sessionQuery = ({
  queryKey: ['session'],
  queryFn: () => authClient.getSession(),
} satisfies QueryOptions)
