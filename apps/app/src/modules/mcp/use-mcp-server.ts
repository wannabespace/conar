import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

export const mcpClientsQuery = queryOptions({
  queryFn: () => window.electron?.mcp.clients(),
  queryKey: ['mcp', 'clients'],
  refetchInterval: 10_000,
})

export const mcpStatusQuery = queryOptions({
  queryFn: () => window.electron?.mcp.status(),
  queryKey: ['mcp', 'status'],
})

export const useMcpServer = () => {
  const { data: status } = useQuery(mcpStatusQuery)
  const { mutate: setEnabled } = useMutation({
    meta: { event: 'mcp_server_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.mcp.setEnabled(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) =>
      queryClient.setQueryData(mcpStatusQuery.queryKey, next),
  })
  return { setEnabled, status }
}
