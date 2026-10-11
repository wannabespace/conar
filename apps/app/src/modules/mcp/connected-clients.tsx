import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceStrict } from 'date-fns'

export const ConnectedClients = () => {
  const { data: clients, dataUpdatedAt } = useQuery({
    queryFn: () => window.electron?.mcp.clients(),
    queryKey: ['mcp', 'clients'],
    refetchInterval: 10_000,
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
