import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../components/table/footer'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryClient } from '~/main'
import { rowsSql } from '../sql/rows'
import { countType, totalSql } from '../sql/total'
import { databasePrimaryKeysQuery } from './primary-keys'

export function databaseRowsQuery(
  database: Database,
  table: string,
  schema: string,
  query?: {
    limit?: PageSize
    page?: number
    orderBy?: string
  },
) {
  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  const queryMap: Record<DatabaseType, () => Promise<{
    rows: Record<string, unknown>[]
    columns: string[]
    total: number
  }>> = {
    postgres: async () => {
      const primaryKeys = await queryClient.ensureQueryData(databasePrimaryKeysQuery(database))
      const primaryKey = primaryKeys?.find(p => p.schema === schema && p.table === table)?.primaryKeys[0]
      const orderBy = query?.orderBy ?? primaryKey

      const [[result], [countResult]] = await Promise.all([
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: rowsSql(schema, table, {
            limit: _limit,
            page: _page,
            orderBy,
          })[database.type],
        }),
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: totalSql(schema, table)[database.type],
        }),
      ])

      const tableCount = countType.assert(countResult.rows[0])

      return {
        rows: result.rows,
        columns: result.columns,
        total: Number(tableCount.total || 0),
      }
    },
  }

  return queryOptions({
    queryKey: [
      'database',
      database.id,
      'table',
      schema,
      table,
      'rows',
      {
        limit: _limit,
        page: _page,
      },
    ],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseRows(database: Database, table: string, schema: string, query: { limit?: PageSize, page?: number } = {}) {
  return useQuery(databaseRowsQuery(database, table, schema, query))
}
