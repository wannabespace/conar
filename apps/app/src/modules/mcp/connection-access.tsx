import type { McpAccess } from '@tamery/shared/mcp'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Switch } from '@tamery/ui/components/switch'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCollections } from '~/core/collections'
import { ConnectionIcon } from '~/core/connection/connection-icon'
import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { queryClient } from '~/lib/query-client'

import type { ElectronMcp } from './electron-mcp'

const ACCESS: { label: string; value: McpAccess }[] = [
  { label: 'Read only', value: 'read' },
  { label: 'Ask before writing', value: 'ask' },
  { label: 'Read and write', value: 'write' },
]

const accessQueryKey = ['mcp', 'connection-access']

export const ConnectionAccess = ({ mcp }: { mcp: ElectronMcp }) => {
  const { connectionsCollection } = useCollections()
  const { data: connections } = useLiveQuery({
    query: (q) =>
      q
        .from({ connection: connectionsCollection })
        .orderBy(({ connection }) => connection.name),
  })
  const { data: access } = useQuery({
    queryFn: () => mcp.connectionAccess(),
    queryKey: accessQueryKey,
  })
  const { mutate: setEnabled } = useMutation({
    meta: { event: 'mcp_connection_toggled' },
    mutationFn: (args: Parameters<ElectronMcp['setConnectionEnabled']>[0]) =>
      mcp.setConnectionEnabled(args),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(accessQueryKey, next),
  })
  const { mutate: setAccess } = useMutation({
    meta: { event: 'mcp_connection_access_changed' },
    mutationFn: (args: Parameters<ElectronMcp['setAccess']>[0]) =>
      mcp.setAccess(args),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(accessQueryKey, next),
  })

  if (!access || connections.length === 0) {
    return null
  }

  return (
    <SettingsGroup title="Connection access">
      {connections.map((connection) => {
        const enabled = !access.disabledIds.includes(connection.id)
        const connectionAccess: McpAccess =
          access.access[connection.id] ?? 'ask'

        return (
          <SettingsRow
            key={connection.id}
            title={
              <>
                <ConnectionIcon type={connection.type} className="size-4" />
                <span data-mask>{connection.name}</span>
              </>
            }
          >
            <Select
              disabled={!enabled}
              items={ACCESS}
              value={connectionAccess}
              onValueChange={(value) => {
                if (value) {
                  setAccess({ access: value, connectionId: connection.id })
                }
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label={`Agent access to ${connection.name}`}
                className="w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent size="sm">
                {ACCESS.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Switch
              size="sm"
              className="ml-2"
              aria-label={`Share ${connection.name} with agents`}
              checked={enabled}
              onCheckedChange={(next) =>
                setEnabled({ connectionId: connection.id, enabled: next })
              }
            />
          </SettingsRow>
        )
      })}
    </SettingsGroup>
  )
}
