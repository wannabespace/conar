import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

const QUERY_KEY = ['mcp', 'keep-running']

export const KeepRunningRow = () => {
  const { data: keepRunning } = useQuery({
    queryFn: () => window.electron?.keepRunning.get(),
    queryKey: QUERY_KEY,
  })
  const { mutate: setKeepRunning } = useMutation({
    meta: { event: 'mcp_background_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.keepRunning.set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(QUERY_KEY, next),
  })

  return (
    <SettingsRow
      htmlFor="mcp-keep-running"
      title="Keep running in the background"
      description="Closing the window keeps Tamery and the server running, so agents keep working until you quit."
    >
      <Switch
        id="mcp-keep-running"
        size="sm"
        checked={!!keepRunning}
        onCheckedChange={(enabled) => setKeepRunning(enabled)}
      />
    </SettingsRow>
  )
}
