import { useQuery } from '@tanstack/react-query'
import { formatDistanceStrict } from 'date-fns'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'

import type { ElectronMcp } from './electron-mcp'

export const ConnectedClients = ({ mcp }: { mcp: ElectronMcp }) => {
  const { data: clients, dataUpdatedAt } = useQuery({
    queryFn: () => mcp.clients(),
    queryKey: ['mcp', 'clients'],
    refetchInterval: 1000,
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
            active{' '}
            {formatDistanceStrict(client.lastSeenAt, dataUpdatedAt, {
              addSuffix: true,
            })}
          </span>
        </SettingsRow>
      ))}
    </SettingsGroup>
  )
}
