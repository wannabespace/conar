import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { totalSql } from '../sql/total'

export function databaseTableTotalQuery({
  database,
  table,
  schema,
  query,
}: {
  database: typeof databases.$inferSelect
  table: string
  schema: string
  query: { filters: ActiveFilter[] }
}) {
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
    queryFn: () => totalSql(database, { schema, table, filters: query.filters }).then(result => result[0]!.total),
    throwOnError: false,
  })
}

export function useDatabaseTableTotal(...params: Parameters<typeof databaseTableTotalQuery>) {
  return useQuery(databaseTableTotalQuery(...params))
}
