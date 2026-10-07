import type { McpSource } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { silently } from '@tamery/shared/utils'
import { dialects, readsOnly, splitStatements } from '@tamery/sql'

import { getCollections } from '~/core/collections'
import {
  refreshAfterRun,
  statementQuery,
} from '~/core/queries/connection/statement'
import { transactionQuery } from '~/core/queries/connection/transaction'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import {
  cancelQuery,
  connectionResourceToQueryParams,
  connectionToQueryParams,
} from '~/core/runtime/query'
import { posthog } from '~/lib/posthog'

import { approval } from './approval'
import { describeTable } from './describe-table'
import {
  resourcesOf,
  fetchForAgent,
  resolveResource,
  resolveTarget,
} from './target'

export const mcpSource: McpSource = {
  connections: () =>
    getCollections().connectionsCollection.toArray.map((connection) => ({
      id: connection.id,
      name: connection.name,
      resources: resourcesOf(connection.id),
      type: connection.type,
    })),
  describeTable,
  query: async ({ access, sql, ...target }, onAbort) => {
    const { connection, resource } = resolveTarget(target)
    const dialect = dialects[connection.type]
    const write = access !== 'read'
    if (write && splitStatements(sql, dialect).length !== 1) {
      throw new Error(
        'Run one statement at a time, or wrap several in BEGIN … COMMIT to run them together.'
      )
    }
    if (!write && !readsOnly(sql, dialect)) {
      throw new Error(
        'Only one read-only statement (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN) runs at a time.'
      )
    }

    const params = {
      ...(await (resource
        ? connectionResourceToQueryParams(resource)
        : connectionToQueryParams(connection))),
      resultSets: { maxRows: MCP_MAX_ROWS },
    }
    const controller = new AbortController()
    onAbort(() => controller.abort())
    if (access === 'ask') {
      await approval.request({
        connection,
        params,
        signal: controller.signal,
        sql,
      })
    }
    const { queryIds, run } = write
      ? statementQuery(sql, connection.type, controller.signal)
      : transactionQuery(
          { accessMode: 'read only', commit: false, statements: [sql] },
          controller.signal
        )
    controller.signal.addEventListener('abort', () => {
      for (const queryId of queryIds) {
        void silently(() => cancelQuery(params, queryId))
      }
    })

    let success = false
    try {
      const sets = await run(params)
      success = true
      if (write && resource) {
        refreshAfterRun(resource, connection.type, [{ text: sql }])
      }
      return sets
    } finally {
      posthog.capture('mcp_query_run', {
        access,
        connection_type: connection.type,
        success,
      })
    }
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
