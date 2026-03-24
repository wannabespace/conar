import { toastManager } from '@conar/ui/components/toast'
import { useMutation } from '@tanstack/react-query'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat/sync'
import { connectionsCollection } from '~/entities/connection/sync'
import { queriesCollection } from '~/entities/query/sync'
import { authClient, fullSignOut } from '~/lib/auth'
import { handleError } from '~/lib/error'
import { queryClient } from '~/main'

export function useSignOut() {
  const { refetch } = authClient.useSession()

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await fullSignOut()
      refetch()
    },
    onSuccess: () => {
      toastManager.add({
        title: 'You have been signed out successfully.',
        type: 'success',
      })

      // Timeout to wait transition to auth page
      setTimeout(() => {
        queryClient.invalidateQueries()
        connectionsCollection.cleanup()
        chatsCollection.cleanup()
        chatsMessagesCollection.cleanup()
        queriesCollection.cleanup()
      }, 1000)
    },
    onError: handleError,
  })

  return {
    signOut,
    isSigningOut,
  }
}
