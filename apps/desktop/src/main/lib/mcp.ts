import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { PORTS } from '@tamery/shared/constants'
import type { McpAccess, McpClient, McpStatus } from '@tamery/shared/mcp'
import Store from 'electron-store'

import { createMcpServer } from './mcp-tools'
import { notifyUnfocused } from './notify'

const newToken = () => randomBytes(32).toString('base64url')

const store = new Store<{
  access: Record<string, Exclude<McpAccess, 'ask'>>
  clients: Record<string, Omit<McpClient, 'name'>>
  enabled: boolean
  token: string
}>({
  defaults: {
    access: {},
    clients: {},
    enabled: true,
    token: newToken(),
  },
  name: 'mcp',
})

let httpServer: Server | null = null
let error: string | null = null

const recordClient = (client: Pick<McpClient, 'name' | 'version'>) => {
  store.set('clients', {
    ...store.get('clients'),
    [client.name]: { connectedAt: Date.now(), version: client.version },
  })
}

const handle = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url !== '/mcp') {
    res.writeHead(404).end()
    return
  }
  if (req.headers.authorization !== `Bearer ${store.get('token')}`) {
    res.writeHead(401).end()
    return
  }
  if (req.method !== 'POST') {
    res.writeHead(405).end()
    return
  }
  const server = createMcpServer(store.get('access'))
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  })
  // Closing the server aborts each tool call's `signal`, which cancels its query in the renderer.
  res.on('close', () => {
    const client = server.server.getClientVersion()
    if (client) {
      recordClient(client)
    }
    void server.close()
  })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res)
  } catch {
    res.destroy()
  }
}

const start = async () => {
  if (httpServer) {
    return
  }
  const server = createServer(handle)
  server.listen(PORTS.MCP, '127.0.0.1')
  try {
    await once(server, 'listening')
    httpServer = server
    error = null
  } catch (listenError) {
    error =
      listenError instanceof Error ? listenError.message : String(listenError)
  }
}

const stop = () => {
  httpServer?.close()
  httpServer = null
  error = null
}

const status = (): McpStatus => {
  if (httpServer) {
    return {
      state: 'running',
      token: store.get('token'),
      url: `http://127.0.0.1:${PORTS.MCP}/mcp`,
    }
  }
  return error ? { error, state: 'failed' } : { state: 'off' }
}

const connectionAccess = () => store.get('access')

export const mcp = {
  clients: (): McpClient[] =>
    Object.entries(store.get('clients'))
      .map(([name, client]) => ({ name, ...client }))
      .toSorted((a, b) => b.connectedAt - a.connectedAt),
  connectionAccess,
  notify: notifyUnfocused,
  regenerateToken: () => {
    store.set('token', newToken())
    store.set('clients', {})
    return status()
  },
  setAccess: ({
    access,
    connectionId,
  }: {
    access: McpAccess
    connectionId: string
  }) => {
    const { [connectionId]: _previous, ...others } = store.get('access')
    store.set(
      'access',
      access === 'ask' ? others : { ...others, [connectionId]: access }
    )
    return connectionAccess()
  },
  setEnabled: async (enabled: boolean) => {
    store.set('enabled', enabled)
    await (enabled ? start() : stop())
    return status()
  },
  status,
}

export const restoreMcpServer = async () => {
  if (store.get('enabled')) {
    await start()
  }
}
