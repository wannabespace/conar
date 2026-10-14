import { useMutation } from '@tanstack/react-query'
import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { updateConnection } from '~/core/connection/update'
import type { SavedConnection } from '~/modules/connection-form/lib/use-save-connection'

export const useUpdateConnection = (connectionId: string) => {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return useMutation({
    meta: { event: 'connection_updated' },
    mutationFn: async (data: SavedConnection) => {
      const tx = await updateConnection(connectionId, data)

      if (!window.electron && navigator.onLine) {
        await tx.isPersisted.promise
      }

      if (canGoBack) {
        router.history.back()
      } else {
        await router.navigate({ to: '/' })
      }
      toast.success('Connection saved')
    },
  })
}
