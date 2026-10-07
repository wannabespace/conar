import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { PORTS } from '@tamery/shared/constants'
import type { McpReply, McpRequest, McpStatus } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { app, BrowserWindow, MessageChannelMain } from 'electron'
import Store from 'electron-store'
import { z } from 'zod'

const store = new Store<{ enabled: boolean; token: string }>({
  defaults: { enabled: true, token: randomBytes(32).toString('base64url') },
  name: 'mcp',
})

let httpServer: Server | null = null
let error: string | null = null

const ask = async (
  window: BrowserWindow,
  request: McpRequest,
  signal: AbortSignal
): Promise<McpReply> => {
  signal.throwIfAborted()
  const { port1, port2 } = new MessageChannelMain()
  const closed = new AbortController()
  const abort = () => port1.postMessage('abort')
  port1.once('close', () => closed.abort())
  signal.addEventListener('abort', abort, { once: true })
  port1.start()
  window.webContents.postMessage('mcp.request', request, [port2])
  try {
    const [{ data }] = await once(port1, 'message', {
      signal: AbortSignal.any([signal, closed.signal]),
    })
    port1.close()
    return data
  } catch (askError) {
    throw closed.signal.aborted
      ? new Error('The Tamery window closed before answering.')
      : askError
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

const askRenderer = async (request: McpRequest, signal: AbortSignal) => {
  for (const window of BrowserWindow.getAllWindows()) {
    // Sequential by design: the first window serving answers, the rest are never asked.
    // oxlint-disable-next-line no-await-in-loop
    const reply = await ask(window, request, signal)
    if ('error' in reply) {
      throw new Error(reply.error)
    }
    if ('result' in reply) {
      return reply.result
    }
  }
  throw new Error('Open Tamery and sign in first.')
}

const jsonContent = (value: unknown) => ({
  content: [
    {
      text: JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint' ? item.toString() : item
      ),
      type: 'text' as const,
    },
  ],
})

const createMcpServer = () => {
  const server = new McpServer({ name: 'tamery', version: app.getVersion() })

  server.registerTool(
    'list_connections',
    {
      annotations: { readOnlyHint: true },
      description:
        'List the database connections saved in Tamery: id, name, engine and the databases opened in it.',
    },
    async ({ signal }) =>
      jsonContent(
        await askRenderer({ args: undefined, method: 'connections' }, signal)
      )
  )

  server.registerTool(
    'query',
    {
      annotations: { readOnlyHint: true },
      description: `Run one read-only SQL statement on a Tamery connection, in the connection's own SQL dialect. Writes are rejected and the statement runs in a transaction that is always rolled back. At most ${MCP_MAX_ROWS} rows come back; "truncated" says there were more. Explore the schema through the engine's catalog (information_schema, system tables).`,
      inputSchema: {
        connectionId: z.string().describe('Id from list_connections'),
        database: z
          .string()
          .optional()
          .describe(
            "Database from list_connections to run in; defaults to the connection's own database"
          ),
        sql: z.string(),
      },
    },
    async (args, { signal }) =>
      jsonContent(await askRenderer({ args, method: 'query' }, signal))
  )

  return server
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
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  })
  // Closing the server aborts each tool call's `signal`, which cancels its query in the renderer.
  res.on('close', () => {
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

export const mcp = {
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
