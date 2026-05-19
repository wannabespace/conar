import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { fullSignOut } from '~/lib/auth'
import { handleError } from '~/lib/error'

export function useSignOut() {
  const router = useRouter()
  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await fullSignOut()
    },
    onSuccess: () => {
      toast.success('You have been signed out successfully.')

      router.navigate({ to: '/auth', reloadDocument: true })
    },
    onError: handleError,
  })

  return {
    signOut,
    isSigningOut,
  }
}
