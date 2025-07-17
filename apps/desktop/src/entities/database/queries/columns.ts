import type { Database } from '~/lib/indexeddb'
import { columnSchema, columnsSql } from '@conar/shared/sql/columns'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function databaseTableColumnsQuery(database: Database, table: string, schema: string) {
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

export function useDatabaseTableColumns(...params: Parameters<typeof databaseTableColumnsQuery>) {
  return useQuery(databaseTableColumnsQuery(...params))
}
