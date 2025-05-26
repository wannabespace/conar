import type { WhereFilter } from '../sql/where'
import type { PageSize } from '~/components/table'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { rowsSql } from '../sql/rows'
import { whereSql } from '../sql/where'

export function databaseRowsQuery(
  database: Database,
  table: string,
  schema: string,
  query?: {
    pageSize: PageSize
    page: number
    orderBy: Record<string, 'ASC' | 'DESC'>
    filters: WhereFilter[]
  },
) {
  const _pageSize: PageSize = query?.pageSize ?? 50
  const _page = query?.page ?? 1
  const _orderBy = query?.orderBy ?? {}
  const _filters = query?.filters ?? []

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
        pageSize: _pageSize,
        page: _page,
        orderBy: _orderBy,
        filters: _filters,
      },
    ],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: rowsSql(schema, table, {
          limit: _pageSize,
          page: _page,
          orderBy: _orderBy,
          where: whereSql(_filters)[database.type],
        })[database.type],
      })

      return {
        rows: result.rows,
        columns: result.columns,
      }
    },
  })
}

export function useDatabaseRows(...params: Parameters<typeof databaseRowsQuery>) {
  return useQuery(databaseRowsQuery(...params))
}
