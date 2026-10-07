import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpAccess, McpRequest } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { silently } from '@tamery/shared/utils'
import { app } from 'electron'
import { z } from 'zod'

import { askRenderer } from './mcp-renderer'
import { notifyUnfocused } from './notify'

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

const targetInput = {
  connectionId: z.string().describe('Id from list_connections'),
  resource: z
    .string()
    .optional()
    .describe(
      "Resource (a database) from list_connections; defaults to the connection's own database"
    ),
}

const sqlInput = { ...targetInput, sql: z.string() }

const INSTRUCTIONS = `Tamery is the user's database client. Start with list_connections, then read the schema with list_tables and describe_table before writing SQL in the connection's own dialect. When the user names a record, value or thing to change, it almost always lives in the data, not in Tamery: connection names are only labels and no tool edits them. Find it before answering — pick the likely tables from their names and columns, search them with query (case-insensitive, partial match), and if several rows or connections could match, show the candidates and ask which one. query only reads; execute changes data or schema, and only on connections whose access is "ask" or "write". On "ask" the user reviews each statement in Tamery and approves or declines it, so explain in your reply what it changes. Results stop at ${MCP_MAX_ROWS} rows, so filter or aggregate in SQL instead of reading whole tables.`

const NAME_LOOKUP_TIMEOUT_MS = 2000

// Not the tool call's signal: the request closes, and aborts it, as soon as the tool returns.
const notifyAbout = (
  connectionId: string,
  message: (name: string) => { body: string; title: string }
) =>
  silently(async () => {
    const connections = await askRenderer(
      { args: undefined, method: 'connections' },
      AbortSignal.timeout(NAME_LOOKUP_TIMEOUT_MS)
    )
    const name =
      connections.find((connection) => connection.id === connectionId)?.name ??
      'a connection'
    notifyUnfocused(message(name))
  })

export const createMcpServer = ({
  access,
  disabledConnectionIds,
}: {
  access: Record<string, McpAccess>
  disabledConnectionIds: string[]
}) => {
  const server = new McpServer(
    { name: 'tamery', version: app.getVersion() },
    { instructions: INSTRUCTIONS }
  )
  const accessOf = (connectionId: string): McpAccess =>
    access[connectionId] ?? 'ask'

  const askShared = (
    request: Exclude<McpRequest, { method: 'connections' }>,
    signal: AbortSignal
  ) => {
    if (disabledConnectionIds.includes(request.args.connectionId)) {
      throw new Error(
        `Connection "${request.args.connectionId}" is not shared with agents. The user can share it in Tamery → Settings → MCP.`
      )
    }
    return askRenderer(request, signal)
  }

  server.registerTool(
    'list_connections',
    {
      annotations: { readOnlyHint: true },
      description:
        'List the database connections saved in Tamery: id, name, engine, the resources (databases) opened in it, and the access the user gave agents: "read" (query only), "ask" (each execute waits for the user to approve it) or "write" (execute runs at once).',
    },
    async ({ signal }) => {
      const connections = await askRenderer(
        { args: undefined, method: 'connections' },
        signal
      )
      return jsonContent(
        connections
          .filter(
            (connection) => !disabledConnectionIds.includes(connection.id)
          )
          .map((connection) => ({
            ...connection,
            access: accessOf(connection.id),
          }))
      )
    }
  )

  server.registerTool(
    'query',
    {
      annotations: { readOnlyHint: true },
      description: `Run one read-only SQL statement on a Tamery connection, in the connection's own SQL dialect. Writes are rejected and the statement runs in a transaction that is always rolled back. At most ${MCP_MAX_ROWS} rows come back; "truncated" says there were more. Read the schema with list_tables and describe_table first.`,
      inputSchema: sqlInput,
    },
    async (args, { signal }) =>
      jsonContent(
        await askShared(
          { args: { ...args, access: 'read' }, method: 'query' },
          signal
        )
      )
  )

  server.registerTool(
    'list_tables',
    {
      annotations: { readOnlyHint: true },
      description:
        'List the schemas of a Tamery connection with their tables and views. In MySQL and ClickHouse a schema is a database. Pass schema to list only that one on a large database.',
      inputSchema: {
        ...targetInput,
        schema: z.string().optional(),
      },
    },
    async (args, { signal }) =>
      jsonContent(await askShared({ args, method: 'tables' }, signal))
  )

  server.registerTool(
    'describe_table',
    {
      annotations: { readOnlyHint: true },
      description:
        'Describe one table or view: its columns (type, nullability, default, enum values), constraints (primary key, foreign keys with what they reference, unique, check) and indexes.',
      inputSchema: {
        ...targetInput,
        schema: z.string().describe('Schema from list_tables'),
        table: z.string(),
      },
    },
    async (args, { signal }) =>
      jsonContent(await askShared({ args, method: 'describeTable' }, signal))
  )

  server.registerTool(
    'execute',
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description: `Run one SQL statement that may change data or schema, on a Tamery connection whose access is "ask" or "write", in the connection's own SQL dialect. It commits; wrap several statements in BEGIN … COMMIT to run them as one transaction. On "ask" it waits until the user approves it in Tamery, and fails if they decline. Use query for reads. At most ${MCP_MAX_ROWS} rows come back.`,
      inputSchema: sqlInput,
    },
    async (args, { signal }) => {
      const connectionAccess = accessOf(args.connectionId)
      if (connectionAccess === 'read') {
        throw new Error(
          `Connection "${args.connectionId}" is read-only for agents. The user can allow writes in Tamery → Settings → MCP.`
        )
      }
      // askShared throws at once for a connection the user hid, so nothing below announces it.
      const pending = askShared(
        { args: { ...args, access: connectionAccess }, method: 'query' },
        signal
      )
      const bounce =
        connectionAccess === 'ask' ? app.dock?.bounce('critical') : undefined
      if (connectionAccess === 'ask') {
        void notifyAbout(args.connectionId, (name) => ({
          body: 'Review the statement in Tamery to run or decline it.',
          title: `An agent wants to change ${name}`,
        }))
      }
      try {
        const result = await pending
        if (connectionAccess === 'write') {
          void notifyAbout(args.connectionId, (name) => ({
            body: args.sql,
            title: `An agent changed ${name}`,
          }))
        }
        return jsonContent(result)
      } finally {
        if (bounce !== undefined) {
          app.dock?.cancelBounce(bounce)
        }
      }
    }
  )

  return server
}
