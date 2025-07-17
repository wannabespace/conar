import type { Database } from '~/lib/indexeddb'
import { columnSchema, columnsSql } from '@conar/shared/sql/columns'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function columnsQuery(database: Database, table: string, schema: string) {
  return queryOptions({
    queryKey: ['database', database.id, 'columns', schema, table],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: columnsSql(schema, table)[database.type],
      })

      return result.rows.map(col => columnSchema.parse(col))
    },
  })
}

export function useDatabaseColumns(...params: Parameters<typeof columnsQuery>) {
  return useQuery(columnsQuery(...params))
}
