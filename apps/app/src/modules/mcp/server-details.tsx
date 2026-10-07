import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { posthog } from '~/lib/posthog'

import type { McpServer } from './clients'
import { CopyValue } from './copy-value'

const VISIBLE_TOKEN_CHARS = 4

export const ServerDetails = ({ token, url }: McpServer) => (
  <SettingsGroup title="Server">
    <SettingsRow
      title="URL"
      description="Streamable HTTP, reachable only from this computer."
    >
      <code className="text-muted-foreground font-mono text-xs">{url}</code>
      <CopyValue
        label="Copy URL"
        text={url}
        onCopy={() =>
          posthog.capture('mcp_server_value_copied', { value: 'url' })
        }
      />
    </SettingsRow>
    <SettingsRow
      title="Access token"
      description="Clients send it as a Bearer token in the Authorization header."
    >
      <code data-mask className="text-muted-foreground font-mono text-xs">
        ••••••••{token.slice(-VISIBLE_TOKEN_CHARS)}
      </code>
      <CopyValue
        label="Copy token"
        text={token}
        onCopy={() =>
          posthog.capture('mcp_server_value_copied', { value: 'token' })
        }
      />
    </SettingsRow>
  </SettingsGroup>
)
