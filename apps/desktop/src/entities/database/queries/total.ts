import type { WhereFilter } from '../sql/where'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { totalSql, totalType } from '../sql/total'
import { whereSql } from '../sql/where'

export function databaseTableTotalQuery(
  database: Database,
  table: string,
  schema: string,
  query: {
    filters: WhereFilter[]
  },
) {
  return queryOptions({
    queryKey: [
      'database',
      database.id,
      'schema',
      schema,
      'table',
      table,
      'total',
      query,
    ],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: totalSql(schema, table, {
          where: whereSql(query.filters)[database.type],
        })[database.type],
      })

      return Number(totalType.assert(result.rows[0]).total || 0)
    },
    throwOnError: false,
  })
}

export function useDatabaseTableTotal(...params: Parameters<typeof databaseTableTotalQuery>) {
  return useQuery(databaseTableTotalQuery(...params))
}
