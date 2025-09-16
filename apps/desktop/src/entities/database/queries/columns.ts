import type { databases } from '~/drizzle'
import { columnsSql, columnType } from '@conar/shared/sql/columns'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function databaseTableColumnsQuery({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  return queryOptions({
    queryKey: ['database', database.id, 'columns', schema, table],
    queryFn: async () => {
      const [result] = await dbQuery(database.id, {
        query: columnsSql(schema, table)[database.type],
      })

      return result!.rows.map(col => columnType.assert(col))
    },
  })
}

export function useDatabaseTableColumns(...params: Parameters<typeof databaseTableColumnsQuery>) {
  return useQuery(databaseTableColumnsQuery(...params))
}
