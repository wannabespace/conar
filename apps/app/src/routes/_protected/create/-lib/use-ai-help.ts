import { useMutation, useQuery } from '@tanstack/react-query'

import { usePermissions } from '~/core/user/permissions'
import { usageQueryOptions } from '~/core/user/usage'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { useIsOnline } from '~/store'

export const useAiHelp = () => {
  const { check } = usePermissions()
  const isOnline = useIsOnline()
  const { data: usage } = useQuery({
    ...usageQueryOptions,
    enabled: check('ai.connection.use') && !check('ai.connection.unlimited'),
  })
  const ask = useMutation(
    orpc.ai.diagnoseConnection.mutationOptions({
      meta: { event: 'connection_diagnosed' },
      onSettled: () => queryClient.invalidateQueries(usageQueryOptions),
    })
  )
  const available =
    isOnline &&
    check('ai.connection.use') &&
    (!usage?.connection || usage.connection.used < usage.connection.max)
  return { ask, available }
}
