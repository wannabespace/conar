import type { PageSize } from '../components/table/footer'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { rowsSql } from '../sql/rows'

export function databaseRowsQuery(
  database: Database,
  table: string,
  schema: string,
  query?: {
    limit?: PageSize
    page?: number
    orderBy?: [string, 'ASC' | 'DESC']
    where?: string
  },
) {
  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  return queryOptions({
    queryKey: [
      'database',
      database.id,
      'schema',
      schema,
      'table',
      table,
      'rows',
      {
        limit: _limit,
        page: _page,
        orderBy: query?.orderBy,
        where: query?.where,
      },
    ],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: rowsSql(schema, table, {
          limit: _limit,
          page: _page,
          orderBy: query?.orderBy,
          where: query?.where,
        })[database.type],
      })

      return {
        rows: result.rows,
        columns: result.columns,
      }
    },
  })
}

export function useDatabaseRows(database: Database, table: string, schema: string, query: { limit?: PageSize, page?: number } = {}) {
  return useQuery(databaseRowsQuery(database, table, schema, query))
}
