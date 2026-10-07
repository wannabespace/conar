import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'

import { SettingsGroup } from '~/core/settings/settings-group'
import { posthog } from '~/lib/posthog'

import type { McpEndpoint } from './clients'
import { MCP_CLIENTS } from './clients'
import { CopyValue } from './copy-value'

export const ClientSetup = ({ server }: { server: McpEndpoint }) => (
  <SettingsGroup title="Add to a client">
    <Tabs defaultValue={MCP_CLIENTS[0]?.id}>
      <div className="px-3.5 pt-3.5">
        <TabsList className="w-full">
          {MCP_CLIENTS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {MCP_CLIENTS.map((client) => {
        const code = client.code(server)
        const installLink = client.installLink?.(server)

        return (
          <TabsContent key={client.id} value={client.id}>
            <div className="flex min-h-12 items-center gap-2 px-3.5 py-3">
              <p className="text-muted-foreground min-w-0 flex-1 truncate">
                {client.instruction}{' '}
                {client.file && (
                  <code className="text-foreground font-mono text-xs">
                    {client.file}
                  </code>
                )}
              </p>
              {installLink && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    posthog.capture('mcp_client_install_opened', {
                      client: client.id,
                    })
                    window.open(installLink, '_blank')
                  }}
                >
                  Add to {client.label}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                    data-icon="inline-end"
                  />
                </Button>
              )}
              <CopyValue
                label="Copy"
                text={code}
                onCopy={() =>
                  posthog.capture('mcp_config_copied', { client: client.id })
                }
              />
            </div>
            <CodeBlock
              code={code}
              language={client.language}
              padding="item"
              size="xs"
              variant="inset"
              wrap
            />
          </TabsContent>
        )
      })}
    </Tabs>
  </SettingsGroup>
)
