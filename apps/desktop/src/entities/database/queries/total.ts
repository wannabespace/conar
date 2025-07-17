import type { WhereFilter } from '@conar/shared/sql/where'
import type { Database } from '~/lib/indexeddb'
import { totalSchema, totalSql } from '@conar/shared/sql/total'
import { whereSql } from '@conar/shared/sql/where'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

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
      {
        filters: query.filters,
      },
    ],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: totalSql(schema, table, {
          where: whereSql(query.filters)[database.type],
        })[database.type],
      })

      return totalSchema.parse(result.rows[0]).total
    },
    throwOnError: false,
  })
}

export function useDatabaseTableTotal(...params: Parameters<typeof databaseTableTotalQuery>) {
  return useQuery(databaseTableTotalQuery(...params))
}
