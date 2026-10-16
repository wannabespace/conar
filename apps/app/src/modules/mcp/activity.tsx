import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import { getDialect } from '@tamery/shared/enums/connection-type'
import type { McpCall, McpTool } from '@tamery/shared/mcp'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceStrict } from 'date-fns'
import { useState } from 'react'

import { useCollections } from '~/core/collections'
import type { Connection } from '~/core/connection/sync'
import { posthog } from '~/lib/posthog'
import { formatSql } from '~/utils/formatter'

import { clientLabel } from './clients'
import { mcpCallsQuery } from './use-mcp-server'

const TOOL_LABELS: Record<McpTool, string> = {
  create_connection: 'created a connection',
  describe_table: 'described a table',
  execute: 'ran a change',
  list_connections: 'listed connections',
  list_tables: 'listed tables',
  query: 'ran a query',
}

interface Inspected {
  call: McpCall
  connection: Connection | null
}

const CallTitle = ({ call, connection }: Inspected) => (
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
)

const CallDialog = ({
  inspected,
  onOpenChange,
  open,
}: {
  inspected: Inspected | null
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const sql = inspected?.call.sql

  return (
    <Dialog open={open} onOpenChange={onOpenChange} variant="panel">
      {inspected && sql && (
        <DialogContent showCloseButton={false}>
          <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
            <DialogTitle className="mx-2 min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <CallTitle {...inspected} />
              </span>
            </DialogTitle>
            <CopyIconButton label="Copy query" text={sql} />
            <DialogCloseButton />
          </div>
          <CodeBlock
            // oxlint-disable-next-line shadcn/no-restyle -- the block sits flush under the title row
            className="no-scrollbar scroll-fade min-h-0 flex-1 py-2"
            code={
              inspected.connection
                ? formatSql(sql, getDialect(inspected.connection.type))
                : sql
            }
            language="sql"
            lineNumbers
            size="xs"
            wrap
          />
          {inspected.call.error && (
            <Alert variant="destructive" className="m-2 w-auto shrink-0">
              <AlertDescription data-mask className="wrap-break-word">
                {inspected.call.error}
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

export const Activity = () => {
  const { connectionsCollection } = useCollections()
  const { data: connections } = useLiveQuery({
    query: (q) => q.from({ connection: connectionsCollection }),
  })
  const { data: calls, dataUpdatedAt } = useQuery(mcpCallsQuery)
  const [open, setOpen] = useState(false)
  const [inspected, setInspected] = useState<Inspected | null>(null)

  if (!calls?.length) {
    return null
  }

  return (
    <>
      <SettingsGroup title="Activity">
        {calls.map((call) => {
          const connection =
            connections.find(({ id }) => id === call.connectionId) ?? null

          return (
            <SettingsRow
              key={call.id}
              title={<CallTitle call={call} connection={connection} />}
              description={
                (call.detail || call.error) && (
                  <>
                    {call.detail && (
                      <span data-mask className="font-mono text-xs">
                        {call.detail}
                      </span>
                    )}
                    {call.error && (
                      <span
                        data-mask
                        className="text-destructive block truncate"
                      >
                        {call.error}
                      </span>
                    )}
                  </>
                )
              }
            >
              {call.sql && (
                <IconButton
                  icon={SourceCodeIcon}
                  label="Show query"
                  size="icon-xs"
                  variant="ghost-muted"
                  onClick={() => {
                    posthog.capture('mcp_activity_query_opened', {
                      tool: call.tool,
                    })
                    setInspected({ call, connection })
                    setOpen(true)
                  }}
                />
              )}
              <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                {formatDistanceStrict(call.at, dataUpdatedAt, {
                  addSuffix: true,
                })}
              </span>
            </SettingsRow>
          )
        })}
      </SettingsGroup>
      <CallDialog inspected={inspected} open={open} onOpenChange={setOpen} />
    </>
  )
}
