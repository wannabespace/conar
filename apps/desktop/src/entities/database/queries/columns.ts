import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { columnsSql } from '../sql/columns'

export function databaseTableColumnsQuery({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  return queryOptions({
    queryKey: ['database', database.id, 'columns', schema, table],
    queryFn: () => columnsSql(database, { schema, table }),
  })
}

export function useDatabaseTableColumns(...params: Parameters<typeof databaseTableColumnsQuery>) {
  return useQuery(databaseTableColumnsQuery(...params))
}
