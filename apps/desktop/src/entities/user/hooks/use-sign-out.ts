import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat'
import { databasesCollection } from '~/entities/database'
import { queriesCollection } from '~/entities/query/sync'
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
        queryClient.invalidateQueries()
        databasesCollection.cleanup()
        chatsCollection.cleanup()
        chatsMessagesCollection.cleanup()
        queriesCollection.cleanup()
      }, 1000)
    },
  })

  return {
    data,
    signOut,
    isSigningOut,
  }
}
