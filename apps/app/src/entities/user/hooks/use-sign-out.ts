import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fullSignOut } from '~/lib/auth'
import { queryClient } from '~/main'
import { handleError } from '~/utils/error'

export function useSignOut() {
  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await fullSignOut()
    },
    onSuccess: () => {
      toast.success('You have been signed out successfully.')

      // Timeout to wait transition to auth page
      setTimeout(() => {
        queryClient.removeQueries()
      }, 1000)
    },
    onError: handleError,
  })

  return {
    signOut,
    isSigningOut,
  }
}
