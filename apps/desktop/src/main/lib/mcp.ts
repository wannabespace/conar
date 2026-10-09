import { randomBytes, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer, Server } from 'node:http'
import { json } from 'node:stream/consumers'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
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

let server: Server | Error | null = null

const SESSION_IDLE_MS = 30 * 60 * 1000

interface Session {
  client: Implementation
  lastSeenAt: number
  transport: StreamableHTTPServerTransport
}

const sessions = new Map<string, Session>()

const closeSessions = (seenBefore = Infinity) => {
  for (const [sessionId, { lastSeenAt, transport }] of sessions) {
    if (lastSeenAt < seenBefore) {
      void transport.close()
      sessions.delete(sessionId)
    }
  }
}

const jsonRpcError = (res: ServerResponse, status: number, message: string) => {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(
    JSON.stringify({
      error: { code: -32_000, message },
      id: null,
      jsonrpc: '2.0',
    })
  )
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
    jsonRpcError(res, 400, 'Parse error: Invalid JSON')
    return
  }
  const sessionId = req.headers['mcp-session-id']
  const now = Date.now()
  let session: Session | undefined
  if (sessionId === undefined) {
    if (!isInitializeRequest(body)) {
      jsonRpcError(res, 400, 'Bad Request: No valid session ID provided')
      return
    }
    closeSessions(now - SESSION_IDLE_MS)
    const opened: Session = {
      client: body.params.clientInfo,
      lastSeenAt: now,
      transport: new StreamableHTTPServerTransport({
        enableJsonResponse: true,
        onsessionclosed: (id) => {
          sessions.delete(id)
        },
        onsessioninitialized: (id) => {
          sessions.set(id, opened)
        },
        sessionIdGenerator: randomUUID,
      }),
    }
    await createMcpServer(connectionAccess).connect(opened.transport)
    session = opened
  } else {
    session = sessions.get(String(sessionId))
    if (!session) {
      jsonRpcError(res, 404, 'Session not found')
      return
    }
    session.lastSeenAt = now
  }
  const { client, transport } = session
  store.set('clients', {
    ...store.get('clients'),
    [client.name]: { lastSeenAt: now, version: client.version },
  })
  // The SDK aborts a tool call only on `notifications/cancelled`, which a client that drops the HTTP request never sends.
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
  const { error } = await tryCatchAsync(() =>
    transport.handleRequest(req, res, body)
  )
  if (error) {
    console.error('[MCP]', error)
    res.destroy()
  }
}

const start = async () => {
  if (server instanceof Server) {
    return
  }
  const listening = createServer(handle).listen(PORTS.MCP, '127.0.0.1')
  server = listening
  const { error } = await tryCatchAsync(() => once(listening, 'listening'))
  if (error) {
    server = error
  }
}

const stop = () => {
  closeSessions()
  if (server instanceof Server) {
    server.closeAllConnections()
    server.close()
  }
  server = null
}

const status = (): McpStatus => {
  if (server instanceof Error) {
    return { error: server.message, state: 'failed' }
  }
  if (server) {
    return {
      state: 'running',
      token: store.get('token'),
      url: `http://127.0.0.1:${PORTS.MCP}/mcp`,
    }
  }
  return { state: 'off' }
}

const clients = (): McpClient[] =>
  Object.entries(store.get('clients'))
    .map(([name, client]) => ({ ...client, name }))
    .toSorted((a, b) => b.lastSeenAt - a.lastSeenAt)

export const mcp = {
  clients,
  connectionAccess,
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
