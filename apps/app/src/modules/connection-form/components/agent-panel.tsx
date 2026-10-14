import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Spinner } from '@tamery/ui/components/spinner'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { useCollections } from '~/core/collections'
import { posthog } from '~/lib/posthog'
import { clientLabel, maskedToken, MCP_CLIENTS } from '~/modules/mcp/clients'
import { mcpClientsQuery, useMcpServer } from '~/modules/mcp/use-mcp-server'

import { TerminalLine } from './terminal-line'

export const AgentPanel = () => {
  const { status } = useMcpServer()
  const running = status?.state === 'running'
  const { data: clients = [] } = useQuery({
    ...mcpClientsQuery,
    enabled: running,
  })
  const [picked, setPicked] = useState<string>()
  const lastUsed = MCP_CLIENTS.find(
    ({ label }) => clients[0] && clientLabel(clients[0].name) === label
  )
  const client =
    MCP_CLIENTS.find(({ id }) => id === picked) ?? lastUsed ?? MCP_CLIENTS[0]
  const isCommand = client?.language === 'bash'
  const installLink = running ? client?.installLink?.(status) : undefined
  const { connectionsResourcesCollection } = useCollections()
  const navigate = useNavigate()

  useEffect(() => {
    const openedAt = Date.now()
    const subscription = connectionsResourcesCollection.subscribeChanges(
      (changes) => {
        // Rows streaming in from sync are inserts too: only one created after opening is the agent's.
        const added = changes.find(
          (change) =>
            change.type === 'insert' &&
            new Date(change.value.createdAt).getTime() >= openedAt
        )
        if (added) {
          void navigate({
            params: { resourceId: added.value.id },
            to: '/connection/$resourceId',
          })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [connectionsResourcesCollection, navigate])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Add via MCP</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Your coding agent finds the database in your project and adds it here.
        </p>
      </div>
      {status?.state === 'failed' && (
        <Alert variant="destructive">
          <AlertDescription className="wrap-break-word">
            The server could not start: {status.error}
          </AlertDescription>
        </Alert>
      )}
      {running && client ? (
        <section className="bg-card ring-foreground/4 divide-foreground/6 flex flex-col divide-y overflow-hidden rounded-xl shadow-xl ring">
          <div className="relative flex h-10 items-center justify-center px-3">
            <div aria-hidden className="absolute left-3.5 flex gap-1.5">
              <span className="bg-foreground/10 size-2.5 rounded-full" />
              <span className="bg-foreground/10 size-2.5 rounded-full" />
              <span className="bg-foreground/10 size-2.5 rounded-full" />
            </div>
            <Select
              items={MCP_CLIENTS.map(({ id, label }) => ({ label, value: id }))}
              value={client.id}
              onValueChange={(next) => next && setPicked(next)}
            >
              <SelectTrigger size="sm" variant="ghost-row" aria-label="Agent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent size="sm">
                {MCP_CLIENTS.map(({ id, label }) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TerminalLine
            glyph={isCommand ? '$' : undefined}
            code={client.code(status)}
            display={client.code({
              ...status,
              token: maskedToken(status.token),
            })}
            language={client.language}
            onCopy={() =>
              posthog.capture('mcp_config_copied', { client: client.id })
            }
          >
            {!isCommand && (
              <div className="text-muted-foreground flex min-h-6 items-center gap-2 font-mono text-xs">
                <span className="min-w-0 flex-1 truncate">
                  # {client.instruction} {client.file}
                </span>
                {installLink && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      posthog.capture('mcp_client_install_opened', {
                        client: client.id,
                      })
                      window.open(installLink, '_blank')
                    }}
                  >
                    Install
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      strokeWidth={2}
                      data-icon="inline-end"
                    />
                  </Button>
                )}
              </div>
            )}
          </TerminalLine>
          <TerminalLine
            glyph="›"
            code="Add the database this project uses to Tamery."
            language="text"
            onCopy={() => posthog.capture('connection_agent_prompt_copied')}
          />
          <p className="text-muted-foreground flex items-center gap-2 px-3.5 py-3 font-mono text-xs">
            <Spinner />
            Waiting for your agent…
          </p>
        </section>
      ) : (
        status?.state !== 'failed' && (
          <p className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Spinner />
            Starting Tamery’s MCP server…
          </p>
        )
      )}
    </div>
  )
}
