import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fullSignOut } from '~/lib/auth'
import { handleError } from '~/lib/error'
import { queryClient } from '~/lib/query-client'

const AUTH_PAGE_TRANSITION_MS = 1000

export const useSignOut = () => {
  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      await fullSignOut()
    },
    mutationKey: ['sign-out'],
    onError: handleError,
    onSuccess: () => {
      toast.success('You have been signed out successfully.')

      setTimeout(() => {
        queryClient.removeQueries()
      }, AUTH_PAGE_TRANSITION_MS)
    },
  })

  return {
    isSigningOut,
    signOut,
  }
}
