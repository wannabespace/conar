import type { McpSource } from '@tamery/shared/mcp'
import { MCP_MAX_ROWS } from '@tamery/shared/mcp'
import { silently } from '@tamery/shared/utils'
import { dialects, readsOnly } from '@tamery/sql'

import { getCollections } from '~/core/collections'
import { connectionFetchingConfig } from '~/core/connection/fetching'
import { transactionQuery } from '~/core/queries/connection/transaction'
import {
  cancelQuery,
  connectionResourceToQueryParams,
  connectionToQueryParams,
} from '~/core/runtime/query'
import { posthog } from '~/lib/posthog'

export const mcpSource: McpSource = {
  connections: () => {
    const { connectionsCollection, connectionsResourcesCollection } =
      getCollections()
    const resources = connectionsResourcesCollection.toArray

    return connectionsCollection.toArray.map((connection) => ({
      databases: resources.flatMap((resource) =>
        resource.connectionId === connection.id && resource.name
          ? [resource.name]
          : []
      ),
      id: connection.id,
      name: connection.name,
      type: connection.type,
    }))
  },
  query: async ({ connectionId, database, sql }, onAbort) => {
    const { connectionsCollection, connectionsResourcesCollection } =
      getCollections()
    const connection = connectionsCollection.get(connectionId)
    if (!connection) {
      throw new Error(
        `Connection "${connectionId}" not found. Call list_connections for valid ids.`
      )
    }

    const { canSend, reason } = connectionFetchingConfig(connection)
    if (!canSend) {
      throw new Error(reason ?? `Open "${connection.name}" in Tamery first.`)
    }

    const resource = database
      ? connectionsResourcesCollection.toArray.find(
          (item) => item.connectionId === connectionId && item.name === database
        )
      : undefined
    if (database && !resource) {
      throw new Error(
        `"${connection.name}" has no database "${database}". Call list_connections for its databases.`
      )
    }

    if (!readsOnly(sql, dialects[connection.type])) {
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
    const { queryIds, run } = transactionQuery(
      { accessMode: 'read only', commit: false, statements: [sql] },
      controller.signal
    )
    onAbort(() => {
      controller.abort()
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
      posthog.capture('mcp_query_run', {
        connection_type: connection.type,
        success,
      })
    }
  },
}
