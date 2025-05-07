import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { totalSql, totalType } from '../sql/total'

export function databaseTableTotalQuery(
  database: Database,
  table: string,
  schema: string,
  query?: {
    where?: string
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
          where: query?.where,
        })[database.type],
      })

      return Number(totalType.assert(result.rows[0]).total || 0)
    },
    throwOnError: false,
  })
}

export function useDatabaseTableTotal(
  database: Database,
  table: string,
  schema: string,
  query?: {
    where?: string
  },
) {
  return useQuery(databaseTableTotalQuery(database, table, schema, query))
}
