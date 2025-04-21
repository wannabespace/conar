import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { totalSql, totalType } from '../sql/total'

export function databaseTotalQuery(
  database: Database,
  table: string,
  schema: string,
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
    ],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: totalSql(schema, table)[database.type],
      })

      return Number(totalType.assert(result.rows[0]).total || 0)
    },
  })
}

export function useDatabaseTotal(database: Database, table: string, schema: string) {
  return useQuery(databaseTotalQuery(database, table, schema))
}
