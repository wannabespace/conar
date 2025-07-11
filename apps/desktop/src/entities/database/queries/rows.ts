import type { WhereFilter } from '../sql/where'
import type { Database } from '~/lib/indexeddb'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'
import { rowsSql } from '../sql/rows'
import { whereSql } from '../sql/where'
import { DEFAULT_LIMIT } from '../utils'

type Page = Awaited<ReturnType<typeof dbQuery>>[0]

export function databaseRowsQuery(
  database: Database,
  table: string,
  schema: string,
  query: {
    orderBy: Record<string, 'ASC' | 'DESC'>
    filters: WhereFilter[]
  },
) {
  return infiniteQueryOptions({
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page, _allPages: Page[], lastPageParam: number) => {
      return lastPage.rows.length === 0 || lastPage.rows.length < DEFAULT_LIMIT ? null : lastPageParam + DEFAULT_LIMIT
    },
    queryKey: [
      'database',
      database.id,
      'schema',
      schema,
      'table',
      table,
      'rows',
      {
        filters: query.filters,
        orderBy: query.orderBy,
      },
    ],
    queryFn: async ({ pageParam: offset = 0 }) => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: rowsSql(schema, table, {
          limit: DEFAULT_LIMIT,
          offset,
          orderBy: query.orderBy,
          where: whereSql(query.filters)[database.type],
        })[database.type],
      })

      return {
        rows: result.rows,
        columns: result.columns,
        count: result.count,
      }
    },
    select: data => data.pages.flatMap(page => page.rows),
  })
}

export function useDatabaseRows(...params: Parameters<typeof databaseRowsQuery>) {
  return useInfiniteQuery(databaseRowsQuery(...params))
}
