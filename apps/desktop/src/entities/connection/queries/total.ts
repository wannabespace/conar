import type { ActiveFilter } from '@conar/shared/filters'
import type { connections } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { totalQuery } from '../sql/total'

export function connectionTableTotalQuery({
  connection,
  table,
  schema,
  query,
}: {
  connection: typeof connections.$inferSelect
  table: string
  schema: string
  query: { filters: ActiveFilter[] }
}) {
  return queryOptions({
    queryKey: [
      'connection',
      connection.id,
      'schema',
      schema,
      'table',
      table,
      'total',
      {
        filters: query.filters,
      },
    ],
    queryFn: () => totalQuery(connection, { schema, table, filters: query.filters }),
    throwOnError: false,
  })
}

export function useConnectionTableTotal(...params: Parameters<typeof connectionTableTotalQuery>) {
  return useQuery(connectionTableTotalQuery(...params))
}
