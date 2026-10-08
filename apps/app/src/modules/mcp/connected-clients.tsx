import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'

import type { ElectronMcp } from './electron-mcp'
import { clientsQueryKey } from './electron-mcp'

export const ConnectedClients = ({ mcp }: { mcp: ElectronMcp }) => {
  const { data: clients } = useQuery({
    queryFn: () => mcp.clients(),
    queryKey: clientsQueryKey,
    staleTime: 0,
  })

  if (!clients?.length) {
    return null
  }

  return (
    <SettingsGroup title="Connected clients">
      {clients.map((client) => (
        <SettingsRow
          key={client.name}
          title={client.name}
          description={`Version ${client.version}`}
        >
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatDistanceToNowStrict(client.connectedAt, { addSuffix: true })}
          </span>
        </SettingsRow>
      ))}
    </SettingsGroup>
  )
}
