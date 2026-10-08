import { GUEST_CONNECTIONS_MESSAGE } from '@tamery/shared/constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { McpAccess, McpSource } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { silently } from '@tamery/shared/utils'
import { dialects, readsOnly, splitStatements } from '@tamery/sql'

import { getCollections } from '~/core/collections'
import { createConnection } from '~/core/connection/create'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import type { ResultSet } from '~/core/queries/connection/custom'
import {
  refreshAfterRun,
  statementQuery,
} from '~/core/queries/connection/statement'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { transactionQuery } from '~/core/queries/connection/transaction'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import type { QueryParams } from '~/core/runtime/query'
import {
  cancelQuery,
  connectionResourceToQueryParams,
  connectionToQueryParams,
} from '~/core/runtime/query'
import { permix } from '~/core/user/permissions'
import { workspaceSelection } from '~/core/workspace/utils'
import { posthog } from '~/lib/posthog'

import { approval } from './approval'
import { describeTable } from './describe-table'
import {
  resourcesOf,
  fetchForAgent,
  resolveResource,
  resolveTarget,
} from './target'

const agentParams = async (
  connection: Connection,
  resource: ConnectionResource | undefined
) => ({
  ...(await (resource
    ? connectionResourceToQueryParams(resource)
    : connectionToQueryParams(connection))),
  resultSets: { maxRows: MCP_MAX_ROWS },
})

const abortSignalOf = (onAbort: (listener: () => void) => void) => {
  const controller = new AbortController()
  onAbort(() => controller.abort())
  return controller.signal
}

const runForAgent = async (
  params: QueryParams,
  {
    queryIds,
    run,
  }: { queryIds: string[]; run: (params: QueryParams) => Promise<ResultSet[]> },
  event: { access: McpAccess; connection_type: ConnectionType },
  signal: AbortSignal
) => {
  signal.addEventListener('abort', () => {
    for (const queryId of queryIds) {
      void silently(() => cancelQuery(params, queryId))
    }
  })
  let success = false
  try {
    const sets = await run(params)
    success = true
    return sets
  } finally {
    posthog.capture('mcp_query_run', { ...event, success })
  }
}

const toMcpConnection = ({
  id,
  name,
  type,
}: Pick<Connection, 'id' | 'name' | 'type'>) => ({
  id,
  name,
  resources: resourcesOf(id),
  type,
})

export const mcpSource: McpSource = {
  connections: () =>
    getCollections().connectionsCollection.toArray.map(toMcpConnection),
  createConnection: async ({ connectionString, name, syncType, type }) => {
    const { connectionsCollection, workspacesCollection } = getCollections()
    if (
      !permix.check('connection.create', {
        count: connectionsCollection.size,
      })
    ) {
      throw new Error(GUEST_CONNECTIONS_MESSAGE)
    }
    const workspace = workspaceSelection.current(workspacesCollection.toArray)
    if (!workspace) {
      throw new Error('Tamery is still loading. Try again in a moment.')
    }
    await testConnectionQuery.run({ connectionString, type })
    const { id } = await createConnection({
      color: null,
      connectionString,
      label: null,
      name,
      syncType,
      type,
      workspaceId: workspace.id,
    })
    posthog.capture('mcp_connection_created', {
      connection_type: type,
      sync_type: syncType,
    })
    void window.electron?.mcp.notify({
      body: name,
      title: 'An agent created a connection',
    })
    return toMcpConnection({ id, name, type })
  },
  describeTable,
  execute: async ({ approve, sql, ...target }, onAbort) => {
    const { connection, resource } = resolveTarget(target)
    if (splitStatements(sql, dialects[connection.type]).length !== 1) {
      throw new Error(
        'Run one statement at a time, or wrap several in BEGIN … COMMIT to run them together.'
      )
    }
    const params = await agentParams(connection, resource)
    const signal = abortSignalOf(onAbort)
    if (approve) {
      await approval.request({ connection, params, signal, sql })
    }
    const sets = await runForAgent(
      params,
      statementQuery(sql, connection.type, signal),
      { access: approve ? 'ask' : 'write', connection_type: connection.type },
      signal
    )
    if (resource) {
      refreshAfterRun(resource, connection.type, [{ text: sql }])
    }
    if (!approve) {
      void window.electron?.mcp.notify({
        body: sql,
        title: `An agent changed ${connection.name}`,
      })
    }
    return sets
  },
  query: async ({ sql, ...target }, onAbort) => {
    const { connection, resource } = resolveTarget(target)
    if (!readsOnly(sql, dialects[connection.type])) {
      throw new Error(
        'Only one read-only statement (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN) runs at a time.'
      )
    }
    const signal = abortSignalOf(onAbort)
    return runForAgent(
      await agentParams(connection, resource),
      transactionQuery(
        { accessMode: 'read only', commit: false, statements: [sql] },
        signal
      ),
      { access: 'read', connection_type: connection.type },
      signal
    )
  },
  tables: async ({ schema, ...target }) => {
    const { connection, resource } = resolveResource(target)
    posthog.capture('mcp_tables_listed', {
      connection_type: connection.type,
      filtered: !!schema,
    })
    const { schemas } = await fetchForAgent(
      resourceTablesAndSchemasQueryOptions({ connectionResource: resource })
    )
    if (!schema) {
      return { schemas }
    }
    const match = schemas.filter(({ name }) => name === schema)
    if (match.length === 0) {
      throw new Error(
        `No schema "${schema}". Call list_tables without schema for the schemas.`
      )
    }
    return { schemas: match }
  },
}
