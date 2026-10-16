import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'

import { ElectronSwitchRow } from '~/core/settings/electron-switch-row'

import { Activity } from './activity'
import { ClientSetup } from './client-setup'
import { ConnectedClients } from './connected-clients'
import { ConnectionAccess } from './connection-access'
import { ServerDetails } from './server-details'
import { useMcpServer } from './use-mcp-server'
import { WeeklyQuota } from './weekly-quota'

export const McpSettings = () => {
  const { setEnabled, status } = useMcpServer()

  if (!status) {
    return null
  }

  return (
    <>
      <SettingsGroup>
        <SettingsRow
          htmlFor="mcp-enabled"
          title="Run MCP server"
          description="Lets AI agents and editors list your connections and query them. Agents read freely and ask you before each write; change that per connection."
        >
          <Switch
            id="mcp-enabled"
            size="sm"
            checked={status.state !== 'off'}
            onCheckedChange={(enabled) => setEnabled(enabled)}
          />
        </SettingsRow>
        {status.state === 'running' && (
          <ElectronSwitchRow
            id="mcp-keep-running"
            title="Keep running in the background"
            description="Closing the window keeps Tamery and the server running, so agents keep working until you quit."
            event="mcp_background_toggled"
            get={() => window.electron?.mcp.keepRunning()}
            set={(enabled) => window.electron?.mcp.setKeepRunning(enabled)}
          />
        )}
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
          <WeeklyQuota />
          <ServerDetails token={status.token} url={status.url} />
          <ConnectedClients />
          <ConnectionAccess />
          <ClientSetup server={status} />
        </>
      )}
      <Activity />
    </>
  )
}
