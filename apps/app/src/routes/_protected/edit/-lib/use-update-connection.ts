import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateConnection } from '~/core/connection/save'
import type { ConnectionDetails } from '~/core/connection/save'
import { useGoBack } from '~/hooks/use-go-back'

export const useUpdateConnection = (connectionId: string) => {
  const goBack = useGoBack()

  return useMutation({
    meta: { event: 'connection_updated' },
    mutationFn: async (connection: ConnectionDetails) => {
      await updateConnection(connectionId, connection)
      goBack()
      toast.success('Connection saved')
    },
  })
}
