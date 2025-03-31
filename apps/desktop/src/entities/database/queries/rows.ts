import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../components/table'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

export function databaseRowsQuery(database: Database, table: string, schema: string, query?: { limit?: PageSize, page?: number }) {
  const countSchema = z.object({
    total: z.coerce.number(),
  })

  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  const queryMap: Record<DatabaseType, () => Promise<{
    rows: Record<string, unknown>[]
    columns: string[]
    total: number
  }>> = {
    postgres: async () => {
      const [[result], [countResult]] = await Promise.all([
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: `SELECT * FROM "${schema}"."${table}" LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}`,
        }),
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: `SELECT COUNT(*) as total FROM "${schema}"."${table}"`,
        }),
      ])

      const tableCount = countSchema.parse(countResult.rows[0])

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
