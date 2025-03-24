import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient, fullSignOut } from '~/lib/auth'
import { clearIndexedDb } from '~/lib/indexeddb'
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
        clearIndexedDb()
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
