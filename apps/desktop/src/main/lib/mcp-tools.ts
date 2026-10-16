import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type {
  ShapeOutput,
  ZodRawShapeCompat,
} from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import { describeConnectionString } from '@tamery/connection/utils'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import type {
  McpAccess,
  McpCall,
  McpRequest,
  McpTarget,
  McpTool,
} from '@tamery/shared/mcp'
import { DEFAULT_MCP_ACCESS, MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { toError } from '@tamery/shared/utils'
import { Result } from 'better-result'
import { app } from 'electron'
import { z } from 'zod'

import { askRenderer } from './mcp-renderer'

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

const INSTRUCTIONS = `Tamery is the user's database client. Start with list_connections, then read the schema with list_tables and describe_table before writing SQL in the connection's own dialect. When the user names a record, value or thing to change, it almost always lives in the data, not in Tamery: connection names are only labels. Find it before answering — pick the likely tables from their names and columns, search them with query using case-insensitive partial matches (e.g. LOWER(column) LIKE '%value%'), and if several rows or connections could match, show the candidates and ask which one. query only reads; execute changes data or schema where the connection's access allows it, and on "ask" the user approves or declines each statement in Tamery, so explain in your reply what it changes. Results stop at ${MCP_MAX_ROWS} rows, so filter or aggregate in SQL instead of reading whole tables. create_connection saves a new connection from a connection string the user gives you; no tool edits or removes one.`

export const createMcpServer = (
  access: () => Record<string, McpAccess>,
  logCall: (call: Omit<McpCall, 'client' | 'id'>) => void
) => {
  const server = new McpServer(
    { name: 'tamery', version: app.getVersion() },
    { instructions: INSTRUCTIONS }
  )

  const getAccess = (connectionId: string): McpAccess =>
    access()[connectionId] ?? DEFAULT_MCP_ACCESS

  const getSharedAccess = (connectionId: string) => {
    const connectionAccess = getAccess(connectionId)
    if (connectionAccess === 'off') {
      throw new Error(
        `Connection "${connectionId}" is not shared with agents. The user can share it in Tamery → Settings → MCP.`
      )
    }
    return connectionAccess
  }

  const askShared = (
    request: Extract<McpRequest, { args: McpTarget }>,
    signal: AbortSignal
  ) => {
    getSharedAccess(request.args.connectionId)
    return askRenderer(request, signal)
  }

  const registerTool = <Shape extends ZodRawShapeCompat>(
    tool: McpTool,
    config: {
      annotations: ToolAnnotations
      description: string
      inputSchema: Shape
    },
    describeCall: (
      args: ShapeOutput<Shape>
    ) => Partial<McpTarget & Pick<McpCall, 'detail' | 'sql'>>,
    run: (args: ShapeOutput<Shape>, signal: AbortSignal) => Promise<unknown>
  ) =>
    server.registerTool<ZodRawShapeCompat, ZodRawShapeCompat>(
      tool,
      config,
      async (input, { signal }) => {
        // The SDK parsed `input` with `config.inputSchema` before calling; TS cannot carry that through a generic shape.
        const args = input as ShapeOutput<Shape>
        const at = Date.now()
        const result = await Result.tryPromise(() => run(args, signal))
        const {
          connectionId = null,
          detail = null,
          resource = null,
          sql = null,
        } = describeCall(args)
        logCall({
          at,
          connectionId,
          detail,
          error: result.isErr() ? toError(result.error.cause).message : null,
          resource,
          sql,
          tool,
        })
        if (result.isErr()) {
          throw result.error.cause
        }
        return jsonContent(result.value)
      }
    )

  registerTool(
    'list_connections',
    {
      annotations: { readOnlyHint: true },
      description:
        'List the database connections saved in Tamery: id, name, engine, the resources (databases) opened in it, and the access the user gave agents: "read" (query only), "ask" (each execute waits for the user to approve it) or "write" (execute runs at once).',
      inputSchema: {},
    },
    () => ({}),
    async (_args, signal) => {
      const connections = await askRenderer(
        { args: undefined, method: 'connections' },
        signal
      )
      return connections.flatMap((connection) => {
        const connectionAccess = getAccess(connection.id)
        return connectionAccess === 'off'
          ? []
          : [{ ...connection, access: connectionAccess }]
      })
    }
  )

  registerTool(
    'create_connection',
    {
      annotations: { destructiveHint: false, readOnlyHint: false },
      description: `Save a new database connection in Tamery from a connection string. Tamery tests it first and saves it only if it connects. Put a database in the string's path to open it as the connection's first resource. The new connection's access is "${DEFAULT_MCP_ACCESS}". Existing connections cannot be edited or removed through MCP, and a string with an SSH tunnel (ssh_* params) is refused.`,
      inputSchema: {
        connectionString: z
          .string()
          .describe(
            'URL with credentials, e.g. postgres://user:pass@host:5432/db'
          ),
        name: z.string().min(2),
        syncType: z
          .enum(SyncType)
          .default(SyncType.Cloud)
          .describe(
            'How the string syncs to the user\'s other devices, always encrypted: "cloud" whole, "cloud_without_secrets" without the password and other secrets, "cloud_without_connection_string" not at all'
          ),
        type: z.enum(ConnectionType),
      },
    },
    ({ name }) => ({ detail: name }),
    async (args, signal) => {
      // A tunnel would let the agent make Tamery read any key file on disk and raise host-key dialogs.
      if (describeConnectionString(args.connectionString).usesSsh) {
        throw new Error(
          'Connections through an SSH tunnel cannot be created through MCP. Ask the user to add this one in Tamery.'
        )
      }
      const connection = await askRenderer(
        { args, method: 'createConnection' },
        signal
      )
      return { ...connection, access: getAccess(connection.id) }
    }
  )

  registerTool(
    'query',
    {
      annotations: { readOnlyHint: true },
      description: `Run one read-only SQL statement on a Tamery connection, in the connection's own SQL dialect. Statements that write are rejected. PostgreSQL, MySQL and ClickHouse also run it read-only, and every engine but ClickHouse, which has no transactions, rolls it back; a function with side effects can still act, so only a read-only database login guarantees no writes. At most ${MCP_MAX_ROWS} rows come back; "truncated" says there were more. Read the schema with list_tables and describe_table first.`,
      inputSchema: sqlInput,
    },
    (args) => args,
    (args, signal) => askShared({ args, method: 'query' }, signal)
  )

  registerTool(
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
    ({ schema, ...target }) => ({ ...target, detail: schema }),
    (args, signal) => askShared({ args, method: 'tables' }, signal)
  )

  registerTool(
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
    ({ schema, table, ...target }) => ({
      ...target,
      detail: `${schema}.${table}`,
    }),
    (args, signal) => askShared({ args, method: 'describeTable' }, signal)
  )

  registerTool(
    'execute',
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description: `Run one SQL statement that may change data or schema, on a Tamery connection whose access is "ask" or "write", in the connection's own SQL dialect. It commits; wrap several statements in BEGIN … COMMIT to run them as one transaction, except on ClickHouse, which has no transactions. On "ask" it waits until the user approves it in Tamery, and fails if they decline. Use query for reads. At most ${MCP_MAX_ROWS} rows come back.`,
      inputSchema: sqlInput,
    },
    (args) => args,
    async (args, signal) => {
      const connectionAccess = getSharedAccess(args.connectionId)
      if (connectionAccess === 'read') {
        throw new Error(
          `Connection "${args.connectionId}" is read-only for agents. The user can allow writes in Tamery → Settings → MCP.`
        )
      }
      const approve = connectionAccess === 'ask'
      const bounce = approve ? app.dock?.bounce('critical') : undefined
      try {
        return await askRenderer(
          { args: { ...args, approve }, method: 'execute' },
          signal
        )
      } finally {
        if (bounce !== undefined) {
          app.dock?.cancelBounce(bounce)
        }
      }
    }
  )

  return server
}
