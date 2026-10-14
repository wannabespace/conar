import { useMutation } from '@tanstack/react-query'

import { usePermissions } from '~/core/user/permissions'
import { orpc } from '~/lib/orpc'
import { useIsOnline } from '~/store'

export const useAiHelp = () => {
  const { check } = usePermissions()
  const isOnline = useIsOnline()
  const ask = useMutation(
    orpc.ai.diagnoseConnection.mutationOptions({
      meta: { event: 'connection_diagnosed' },
    })
  )
  return {
    ask,
    available: isOnline,
    locked: !check('ai.connection.use'),
  }
}
