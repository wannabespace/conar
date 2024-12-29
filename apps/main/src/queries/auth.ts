import type { MutationOptions, QueryOptions } from '@tanstack/react-query'
import { authClient } from '~/lib/auth'

export const sessionQuery = ({
  queryKey: ['session'],
  queryFn: () => authClient.getSession(),
} satisfies QueryOptions)

export const signOutMutation = ({
  mutationKey: ['sign-out'],
  mutationFn: () => authClient.signOut(),
} satisfies MutationOptions)
