import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clearDb } from '~/drizzle'
import { authClient, fullSignOut } from '~/lib/auth'
import { queryClient } from '~/main'

export function useSignOut() {
  const { refetch, data } = authClient.useSession()

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      await fullSignOut()
      refetch()
    },
    onSuccess: () => {
      toast.success('You have been signed out successfully.')

      // Timeout to wait transition to auth page
      setTimeout(() => {
        clearDb()
        queryClient.invalidateQueries()
      }, 1000)
    },
  })

  return {
    data,
    signOut,
    isSigningOut,
  }
}
