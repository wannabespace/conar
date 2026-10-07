import type { McpStatus } from '@tamery/shared/mcp'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { OptionField } from '~/components/option-field'
import { queryClient } from '~/lib/query-client'

import { ConfigSnippet } from './config-snippet'

export type ElectronMcp = NonNullable<Window['electron']>['mcp']

const statusQueryKey = ['mcp', 'status']

const ClientConfigs = ({
  token,
  url,
}: Extract<McpStatus, { state: 'running' }>) => {
  const authorization = `Bearer ${token}`

  return (
    <>
      <ConfigSnippet
        client="claude_code"
        label="Claude Code"
        language="bash"
        code={`claude mcp add --transport http tamery ${url} --header "Authorization: ${authorization}"`}
      />
      <ConfigSnippet
        client="json"
        label="Cursor and other clients"
        language="json"
        code={JSON.stringify(
          {
            mcpServers: {
              tamery: { headers: { Authorization: authorization }, url },
            },
          },
          null,
          2
        )}
      />
    </>
  )
}

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
    <div className="flex flex-col gap-4">
      <OptionField
        htmlFor="mcp-enabled"
        title="Run MCP server"
        description="Starts with Tamery and lets AI agents such as Claude Code and Cursor list your connections and run read-only queries on them."
      >
        <Switch
          id="mcp-enabled"
          size="sm"
          checked={status.state !== 'off'}
          onCheckedChange={(enabled) => setEnabled(enabled)}
        />
      </OptionField>
      {status.state === 'failed' && (
        <Alert variant="destructive">
          <AlertDescription className="wrap-break-word">
            The server could not start: {status.error}
          </AlertDescription>
        </Alert>
      )}
      {status.state === 'running' && <ClientConfigs {...status} />}
    </div>
  )
}
