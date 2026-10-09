import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { posthog } from '~/lib/posthog'

import type { McpEndpoint } from './clients'
import { RegenerateToken } from './regenerate-token'

const VISIBLE_TOKEN_CHARS = 4

export const ServerDetails = ({ token, url }: McpEndpoint) => (
  <SettingsGroup title="Server">
    <SettingsRow
      title="URL"
      description="Streamable HTTP, reachable only from this computer."
    >
      <code className="text-muted-foreground font-mono text-xs">{url}</code>
      <CopyIconButton
        label="Copy URL"
        text={url}
        onClick={() =>
          posthog.capture('mcp_server_value_copied', { value: 'url' })
        }
      />
    </SettingsRow>
    <SettingsRow
      title="Access token"
      description="Clients send it as a Bearer token in the Authorization header. Regenerate it if it leaks."
    >
      <code data-mask className="text-muted-foreground font-mono text-xs">
        ••••••••{token.slice(-VISIBLE_TOKEN_CHARS)}
      </code>
      <CopyIconButton
        label="Copy token"
        text={token}
        onClick={() =>
          posthog.capture('mcp_server_value_copied', { value: 'token' })
        }
      />
      <RegenerateToken />
    </SettingsRow>
  </SettingsGroup>
)
