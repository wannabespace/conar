import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Switch } from '@tamery/ui/components/switch'
import { useQuery } from '@tanstack/react-query'

import { OptionField } from '~/components/option-field'
import { posthog } from '~/lib/posthog'
import { queryClient } from '~/lib/query-client'

import { ConfigSnippet } from './config-snippet'

const statusQueryKey = ['mcp', 'status']

export const McpSettings = () => {
  const { data: status } = useQuery({
    queryFn: () => window.electron?.mcp.status() ?? null,
    queryKey: statusQueryKey,
  })

  if (!status) {
    return null
  }

  const authorization = `Bearer ${status.token}`

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
          checked={status.enabled}
          onCheckedChange={async (enabled) => {
            queryClient.setQueryData(
              statusQueryKey,
              await window.electron?.mcp.setEnabled(enabled)
            )
            posthog.capture('mcp_server_toggled', { enabled })
          }}
        />
      </OptionField>
      {status.enabled && status.error && (
        <Alert variant="destructive">
          <AlertDescription className="wrap-break-word">
            The server could not start: {status.error}
          </AlertDescription>
        </Alert>
      )}
      {status.enabled && !status.error && (
        <>
          <ConfigSnippet
            label="Claude Code"
            language="bash"
            code={`claude mcp add --transport http tamery ${status.url} --header "Authorization: ${authorization}"`}
          />
          <ConfigSnippet
            label="Cursor and other clients"
            language="json"
            code={JSON.stringify(
              {
                mcpServers: {
                  tamery: {
                    headers: { Authorization: authorization },
                    url: status.url,
                  },
                },
              },
              null,
              2
            )}
          />
        </>
      )}
    </div>
  )
}
