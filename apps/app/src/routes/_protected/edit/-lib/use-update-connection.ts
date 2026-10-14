import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateConnection } from '~/core/connection/save'
import { useGoBack } from '~/modules/connection-form/lib/use-go-back'
import type { SavedConnection } from '~/modules/connection-form/lib/use-save-connection'

export const useUpdateConnection = (connectionId: string) => {
  const goBack = useGoBack()

  return useMutation({
    meta: { event: 'connection_updated' },
    mutationFn: async (connection: SavedConnection) => {
      await updateConnection(connectionId, connection)
      goBack()
      toast.success('Connection saved')
    },
  })
}
