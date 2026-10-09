import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { json } from 'node:stream/consumers'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  isInitializeRequest,
  isJSONRPCRequest,
} from '@modelcontextprotocol/sdk/types.js'
import { PORTS } from '@tamery/shared/constants'
import type { McpAccess, McpClient, McpStatus } from '@tamery/shared/mcp'
import { DEFAULT_MCP_ACCESS } from '@tamery/shared/mcp'
import { tryCatchAsync } from '@tamery/shared/utils'
import Store from 'electron-store'

import { createMcpServer } from './mcp-tools'
import { notifyUnfocused } from './notify'

const newToken = () => randomBytes(32).toString('base64url')

const store = new Store<{
  access: Record<string, McpAccess>
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

const connectionAccess = () => store.get('access')

let httpServer: Server | null = null
let error: string | null = null

const SESSION_IDLE_MS = 30 * 60 * 1000

const sessions = new Map<
  string,
  {
    client: string
    lastSeenAt: number
    transport: StreamableHTTPServerTransport
  }
>()

const closeSessions = (idleSince = Infinity) => {
  for (const [sessionId, { lastSeenAt, transport }] of sessions) {
    if (lastSeenAt < idleSince) {
      void transport.close()
      sessions.delete(sessionId)
    }
  }
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
  closeSessions(Date.now() - SESSION_IDLE_MS)
  const client = body.params.clientInfo
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId)
    },
    onsessioninitialized: (sessionId) => {
      const lastSeenAt = Date.now()
      sessions.set(sessionId, { client: client.name, lastSeenAt, transport })
      store.set('clients', {
        ...store.get('clients'),
        [client.name]: { lastSeenAt, version: client.version },
      })
    },
    sessionIdGenerator: randomUUID,
  })
  await createMcpServer(connectionAccess).connect(transport)
  await transport.handleRequest(req, res, body)
}

// The SDK aborts a tool call only on `notifications/cancelled`, which a client that drops the HTTP request never sends.
const cancelOnDisconnect = (
  res: ServerResponse,
  transport: StreamableHTTPServerTransport,
  body: unknown
) => {
  const requestIds = [body]
    .flat()
    .flatMap((message) => (isJSONRPCRequest(message) ? [message.id] : []))
  res.on('close', () => {
    if (res.writableFinished) {
      return
    }
    for (const requestId of requestIds) {
      transport.onmessage?.({
        jsonrpc: '2.0',
        method: 'notifications/cancelled',
        params: { reason: 'The client disconnected.', requestId },
      })
    }
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
  const { data: body, error: parseError } = await tryCatchAsync(() =>
    req.method === 'POST' ? json(req) : Promise.resolve()
  )
  if (parseError) {
    reject(res, 400, 'Parse error: Invalid JSON')
    return
  }
  const sessionId = req.headers['mcp-session-id']
  try {
    if (sessionId === undefined) {
      await startSession(req, res, body)
      return
    }
    const session = sessions.get(String(sessionId))
    if (!session) {
      reject(res, 404, 'Session not found')
      return
    }
    session.lastSeenAt = Date.now()
    cancelOnDisconnect(res, session.transport, body)
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
  const { error: listenError } = await tryCatchAsync(() =>
    once(server, 'listening')
  )
  error = listenError?.message ?? null
  if (!listenError) {
    httpServer = server
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

const clients = (): McpClient[] =>
  Object.entries(store.get('clients'))
    .map(([name, client]) => ({
      ...client,
      lastSeenAt: Math.max(
        client.lastSeenAt,
        ...sessions
          .values()
          .filter((session) => session.client === name)
          .map((session) => session.lastSeenAt)
      ),
      name,
    }))
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
      access === DEFAULT_MCP_ACCESS
        ? others
        : { ...others, [connectionId]: access }
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
