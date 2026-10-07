import type { McpStatus } from '@tamery/shared/mcp'

export type McpServer = Omit<Extract<McpStatus, { state: 'running' }>, 'state'>

const SERVER_NAME = 'tamery'

const headersOf = ({ token }: McpServer) => ({
  Authorization: `Bearer ${token}`,
})

const json = (value: unknown) => JSON.stringify(value, null, 2)

export interface McpClient {
  code: (server: McpServer) => string
  file?: string
  id: string
  instruction: string
  installLink?: (server: McpServer) => string
  label: string
  language: string
}

export const MCP_CLIENTS: McpClient[] = [
  {
    code: (server) =>
      `claude mcp add --transport http ${SERVER_NAME} ${server.url} --header "Authorization: ${headersOf(server).Authorization}"`,
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
    code: (server) =>
      json({
        mcpServers: {
          [SERVER_NAME]: { headers: headersOf(server), url: server.url },
        },
      }),
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
    code: (server) =>
      json({
        mcpServers: {
          [SERVER_NAME]: { headers: headersOf(server), httpUrl: server.url },
        },
      }),
    file: '~/.gemini/settings.json',
    id: 'gemini',
    instruction: 'Add to',
    label: 'Gemini CLI',
    language: 'json',
  },
  {
    code: (server) =>
      json({
        mcpServers: {
          [SERVER_NAME]: { headers: headersOf(server), serverUrl: server.url },
        },
      }),
    file: '~/.codeium/windsurf/mcp_config.json',
    id: 'windsurf',
    instruction: 'Add to',
    label: 'Windsurf',
    language: 'json',
  },
  {
    code: (server) =>
      json({
        mcpServers: {
          [SERVER_NAME]: { headers: headersOf(server), url: server.url },
        },
      }),
    id: 'other',
    instruction:
      'Any client that supports Streamable HTTP works with this URL and header',
    label: 'Other',
    language: 'json',
  },
]
