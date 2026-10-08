import { GUEST_CONNECTIONS_MESSAGE } from '@tamery/shared/constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { McpAccess, McpSource } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { dialects, readsOnly, splitStatements } from '@tamery/sql'

import { getCollections } from '~/core/collections'
import { createConnection } from '~/core/connection/create'
import { refreshAfterRun } from '~/core/connection/refresh-after-run'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import type { ResultSet } from '~/core/queries/connection/custom'
import { statementQuery } from '~/core/queries/connection/statement'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { transactionQuery } from '~/core/queries/connection/transaction'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import type { QueryParams } from '~/core/runtime/query'
import {
  connectionResourceToQueryParams,
  connectionToQueryParams,
} from '~/core/runtime/query'
import { permix } from '~/core/user/permissions'
import { workspaceSelection } from '~/core/workspace/utils'
import { posthog } from '~/lib/posthog'

import { approval } from './approval'
import { describeTable } from './describe-table'
import { mcp } from './electron-mcp'
import {
  resourcesOf,
  fetchForAgent,
  resolveResource,
  resolveTarget,
} from './target'
import { assertQuota, recordQuery } from './usage'

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
  query: { run: (params: QueryParams) => Promise<ResultSet[]> },
  event: { access: McpAccess; connection_type: ConnectionType },
  signal: AbortSignal
) => {
  let success = false
  try {
    const sets = await query.run({ ...params, signal })
    success = true
    void recordQuery()
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
      connectionString,
      name,
      syncType,
      type,
      workspaceId: workspace.id,
    })
    posthog.capture('mcp_connection_created', {
      connection_type: type,
      sync_type: syncType,
    })
    void mcp.notify({
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
    await assertQuota()
    const params = await agentParams(connection, resource)
    const signal = abortSignalOf(onAbort)
    if (approve) {
      await approval.request({
        connection,
        params,
        resourceName: resource?.name ?? null,
        signal,
        sql,
      })
    }
    const sets = await runForAgent(
      params,
      statementQuery(sql, connection.type),
      { access: approve ? 'ask' : 'write', connection_type: connection.type },
      signal
    )
    if (resource) {
      refreshAfterRun(resource, connection.type, sql)
    }
    if (!approve) {
      void mcp.notify({
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
    await assertQuota()
    const signal = abortSignalOf(onAbort)
    return runForAgent(
      await agentParams(connection, resource),
      transactionQuery({
        accessMode: 'read only',
        commit: false,
        statements: [sql],
      }),
      { access: 'read', connection_type: connection.type },
      signal
    )
  },
  tables: async ({ schema, ...target }) => {
    const { connection, resource } = resolveResource(target)
    const { schemas } = await fetchForAgent(
      resourceTablesAndSchemasQueryOptions({ connectionResource: resource })
    )
    posthog.capture('mcp_tables_listed', {
      connection_type: connection.type,
      filtered: !!schema,
    })
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
