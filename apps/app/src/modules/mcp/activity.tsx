import type { McpTool } from '@tamery/shared/mcp'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceStrict } from 'date-fns'

import { useCollections } from '~/core/collections'

import { clientLabel } from './clients'

const TOOL_LABELS: Record<McpTool, string> = {
  create_connection: 'created a connection',
  describe_table: 'described a table',
  execute: 'ran a change',
  list_connections: 'listed connections',
  list_tables: 'listed tables',
  query: 'ran a query',
}

export const Activity = () => {
  const { connectionsCollection } = useCollections()
  const { data: connections } = useLiveQuery({
    query: (q) => q.from({ connection: connectionsCollection }),
  })
  const { data: calls, dataUpdatedAt } = useQuery({
    queryFn: () => window.electron?.mcp.calls(),
    queryKey: ['mcp', 'calls'],
    refetchInterval: 2000,
  })

  if (!calls?.length) {
    return null
  }

  return (
    <SettingsGroup title="Activity">
      {calls.map((call) => {
        const connection = connections.find(
          ({ id }) => id === call.connectionId
        )

        return (
          <SettingsRow
            key={call.id}
            title={
              <>
                {clientLabel(call.client)}
                <span className="text-muted-foreground font-normal">
                  {TOOL_LABELS[call.tool]}
                </span>
                {connection && (
                  <>
                    <ConnectionIcon type={connection.type} className="size-4" />
                    <span data-mask className="truncate">
                      {call.resource
                        ? `${connection.name} / ${call.resource}`
                        : connection.name}
                    </span>
                  </>
                )}
              </>
            }
            description={
              (call.detail || call.error) && (
                <>
                  {call.detail && (
                    <span data-mask className="font-mono">
                      {call.detail}
                    </span>
                  )}
                  {call.error && (
                    <span className="text-destructive block">{call.error}</span>
                  )}
                </>
              )
            }
          >
            <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
              {formatDistanceStrict(call.at, dataUpdatedAt, {
                addSuffix: true,
              })}
            </span>
          </SettingsRow>
        )
      })}
    </SettingsGroup>
  )
}
