import type { MutationOptions, QueryOptions } from '@tanstack/react-query'
import { authClient } from '~/lib/auth'

export function sessionQuery() {
  return {
    queryKey: ['session'],
    queryFn: () => authClient.getSession(),
  } satisfies QueryOptions
}

export function signOutMutation() {
  return {
    mutationKey: ['sign-out'],
    mutationFn: () => authClient.signOut(),
  } satisfies MutationOptions
}
