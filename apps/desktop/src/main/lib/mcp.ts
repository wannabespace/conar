import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { PORTS } from '@tamery/shared/constants'
import type { McpSource, McpStatus, McpTarget } from '@tamery/shared/mcp'
import { dialects, readsOnly } from '@tamery/sql'
import { app, BrowserWindow, MessageChannelMain } from 'electron'
import Store from 'electron-store'
import { z } from 'zod'

import { queryExecutors } from './query'

const MAX_ROWS = 200

const store = new Store<{ enabled: boolean; token: string }>({
  defaults: { enabled: true, token: randomBytes(32).toString('base64url') },
  name: 'mcp',
})

let httpServer: Server | null = null
let error: string | null = null

const askRenderer = async <K extends keyof McpSource>(
  method: K,
  args?: Parameters<McpSource[K]>[0]
): Promise<Awaited<ReturnType<McpSource[K]>>> => {
  const [window] = BrowserWindow.getAllWindows()
  if (!window) {
    throw new Error('Open a Tamery window first.')
  }
  const { port1, port2 } = new MessageChannelMain()
  window.webContents.postMessage('mcp.request', { args, method }, [port2])
  port1.start()
  const [{ data }] = await once(port1, 'message')
  port1.close()
  if (data.error) {
    throw new Error(data.error)
  }
  return data.result
}

const runReadOnly = async (
  { connectionString, type }: McpTarget,
  sql: string
) => {
  if (!readsOnly(sql, dialects[type])) {
    throw new Error(
      'Only one read-only statement (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN) runs at a time.'
    )
  }
  const executor = queryExecutors[type]
  const { txId } = await executor.beginTransaction({
    accessMode: 'read only',
    connectionString,
  })
  try {
    const { result } = await executor.executeTransaction({
      maxRows: MAX_ROWS,
      query: sql,
      txId,
      values: [],
    })
    return result
  } finally {
    await executor.rollbackTransaction({ txId })
  }
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
    async () => jsonContent(await askRenderer('connections'))
  )

  server.registerTool(
    'query',
    {
      annotations: { readOnlyHint: true },
      description: `Run one read-only SQL statement on a Tamery connection, in the connection's own SQL dialect. Writes are rejected and the statement runs in a transaction that is always rolled back. At most ${MAX_ROWS} rows come back; "truncated" says there were more. Explore the schema through the engine's catalog (information_schema, system tables).`,
      inputSchema: {
        connectionId: z.string().describe('Id from list_connections'),
        database: z
          .string()
          .optional()
          .describe(
            "Database to run in; defaults to the connection's own database"
          ),
        sql: z.string(),
      },
    },
    async ({ connectionId, database, sql }) =>
      jsonContent(
        await runReadOnly(
          await askRenderer('target', { connectionId, database }),
          sql
        )
      )
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

const status = (): McpStatus => ({
  enabled: store.get('enabled'),
  error,
  token: store.get('token'),
  url: `http://127.0.0.1:${PORTS.MCP}/mcp`,
})

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
