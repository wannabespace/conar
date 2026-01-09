import type { databases } from '~/drizzle'
import { useQuery } from '@tanstack/react-query'
import { totalQuery } from '../sql/total'

export function useTableRowCount({
  database,
  schema,
  table,
  enforceExactCount,
}: {
  database: typeof databases.$inferSelect
  schema: string
  table: string
  enforceExactCount?: boolean
}) {
  return useQuery({
    queryKey: ['database', database.id, 'schema', schema, 'table', table, 'total', enforceExactCount],
    queryFn: () =>
      totalQuery.run(database, {
        schema,
        table,
        enforceExactCount,
      }),
  })
}