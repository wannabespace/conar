import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { queryClient } from '~/lib/query-client'

import { ClientSetup } from './client-setup'
import { ServerDetails } from './server-details'

export type ElectronMcp = NonNullable<Window['electron']>['mcp']

const statusQueryKey = ['mcp', 'status']

export const McpSettings = ({ mcp }: { mcp: ElectronMcp }) => {
  const { data: status } = useQuery({
    queryFn: () => mcp.status(),
    queryKey: statusQueryKey,
  })
  const { mutate: setEnabled } = useMutation({
    meta: { event: 'mcp_server_toggled' },
    mutationFn: (enabled: boolean) => mcp.setEnabled(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(statusQueryKey, next),
  })

  if (!status) {
    return null
  }

  return (
    <>
      <SettingsGroup>
        <SettingsRow
          htmlFor="mcp-enabled"
          title="Run MCP server"
          description="Lets AI agents and editors list your connections and run read-only queries on them."
        >
          <Switch
            id="mcp-enabled"
            size="sm"
            checked={status.state !== 'off'}
            onCheckedChange={(enabled) => setEnabled(enabled)}
          />
        </SettingsRow>
      </SettingsGroup>
      {status.state === 'failed' && (
        <Alert variant="destructive">
          <AlertDescription className="wrap-break-word">
            The server could not start: {status.error}
          </AlertDescription>
        </Alert>
      )}
      {status.state === 'running' && (
        <>
          <ServerDetails token={status.token} url={status.url} />
          <ClientSetup server={status} />
        </>
      )}
    </>
  )
}
