import type { McpStatus } from '@tamery/shared/mcp'

export type McpEndpoint = Omit<
  Extract<McpStatus, { state: 'running' }>,
  'state'
>

const SERVER_NAME = 'tamery'

const headersOf = ({ token }: McpEndpoint) => ({
  Authorization: `Bearer ${token}`,
})

const json = (value: unknown) => JSON.stringify(value, null, 2)

const mcpServersJson = (urlKey: string) => (server: McpEndpoint) =>
  json({
    mcpServers: {
      [SERVER_NAME]: { headers: headersOf(server), [urlKey]: server.url },
    },
  })

interface McpClientSetup {
  code: (server: McpEndpoint) => string
  file?: string
  id: string
  instruction: string
  installLink?: (server: McpEndpoint) => string
  label: string
  language: string
}

export const MCP_CLIENTS: McpClientSetup[] = [
  {
    code: (server) =>
      `claude mcp add --transport http --scope user ${SERVER_NAME} ${server.url} --header "Authorization: ${headersOf(server).Authorization}"`,
    id: 'claude_code',
    instruction: 'Run in a terminal',
    label: 'Claude Code',
    language: 'bash',
  },
  {
    code: (server) =>
      `[mcp_servers.${SERVER_NAME}]\nurl = "${server.url}"\nhttp_headers = { Authorization = "${headersOf(server).Authorization}" }`,
    file: '~/.codex/config.toml',
    id: 'codex',
    instruction: 'Add to',
    label: 'Codex',
    language: 'toml',
  },
  {
    code: mcpServersJson('url'),
    file: '~/.cursor/mcp.json',
    id: 'cursor',
    installLink: (server) =>
      `cursor://anysphere.cursor-deeplink/mcp/install?name=${SERVER_NAME}&config=${encodeURIComponent(
        btoa(JSON.stringify({ headers: headersOf(server), url: server.url }))
      )}`,
    instruction: 'Add to',
    label: 'Cursor',
    language: 'json',
  },
  {
    code: (server) =>
      json({
        servers: {
          [SERVER_NAME]: {
            headers: headersOf(server),
            type: 'http',
            url: server.url,
          },
        },
      }),
    file: 'MCP: Open User Configuration',
    id: 'vscode',
    installLink: (server) =>
      `vscode:mcp/install?${encodeURIComponent(
        JSON.stringify({
          headers: headersOf(server),
          name: SERVER_NAME,
          type: 'http',
          url: server.url,
        })
      )}`,
    instruction: 'In the Command Palette, run',
    label: 'VS Code',
    language: 'json',
  },
  {
    code: mcpServersJson('httpUrl'),
    file: '~/.gemini/settings.json',
    id: 'gemini',
    instruction: 'Add to',
    label: 'Gemini CLI',
    language: 'json',
  },
  {
    code: mcpServersJson('serverUrl'),
    file: '~/.codeium/windsurf/mcp_config.json',
    id: 'windsurf',
    instruction: 'Add to',
    label: 'Windsurf',
    language: 'json',
  },
  {
    code: mcpServersJson('url'),
    id: 'other',
    instruction:
      'Any client that supports Streamable HTTP works with this URL and header',
    label: 'Other',
    language: 'json',
  },
]
