import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { json } from 'node:stream/consumers'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
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

const sessions = new Map<
  string,
  { client: string; transport: StreamableHTTPServerTransport }
>()

const updateClient = (
  name: string,
  update: Partial<Omit<McpClient, 'name'>>
) => {
  const clients = store.get('clients')
  store.set('clients', {
    ...clients,
    [name]: { ...clients[name], ...update },
  })
}

const closeSessions = () => {
  for (const { transport } of sessions.values()) {
    void transport.close()
  }
  sessions.clear()
}

const reject = (res: ServerResponse, status: number, message: string) => {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(
    JSON.stringify({
      error: { code: -32_000, message },
      id: null,
      jsonrpc: '2.0',
    })
  )
}

const startSession = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown
) => {
  if (!isInitializeRequest(body)) {
    reject(res, 400, 'Bad Request: No valid session ID provided')
    return
  }
  const client = body.params.clientInfo
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId)
    },
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { client: client.name, transport })
      updateClient(client.name, {
        lastSeenAt: Date.now(),
        version: client.version,
      })
    },
    sessionIdGenerator: randomUUID,
  })
  await createMcpServer(() => store.get('access')).connect(transport)
  await transport.handleRequest(req, res, body)
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
  const sessionId = req.headers['mcp-session-id']
  try {
    const body = req.method === 'POST' ? await json(req) : undefined
    if (sessionId === undefined) {
      await startSession(req, res, body)
      return
    }
    const session = sessions.get(String(sessionId))
    if (!session) {
      reject(res, 404, 'Session not found')
      return
    }
    updateClient(session.client, { lastSeenAt: Date.now() })
    await session.transport.handleRequest(req, res, body)
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
  closeSessions()
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

const clients = (): McpClient[] =>
  Object.entries(store.get('clients'))
    .map(([name, client]) => ({ name, ...client }))
    .toSorted((a, b) => b.lastSeenAt - a.lastSeenAt)

export const mcp = {
  clients,
  connectionAccess,
  notify: notifyUnfocused,
  regenerateToken: () => {
    store.set('token', newToken())
    closeSessions()
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
