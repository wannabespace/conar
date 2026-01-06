import type { databases } from '~/drizzle'
import { useQuery } from '@tanstack/react-query'
import { totalQuery } from '../sql/total'

export function useTableRowCount({
  database,
  schema,
  table,
}: {
  database: typeof databases.$inferSelect
  schema: string
  table: string
}) {
  return useQuery({
    queryKey: ['database', database.id, 'schema', schema, 'table', table, 'total'],
    queryFn: () =>
      totalQuery.run(database, {
        schema,
        table,
        enforceExactCount: false,
      }),
    enabled: Boolean(database.id && table),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
