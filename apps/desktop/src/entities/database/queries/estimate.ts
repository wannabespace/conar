import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { useQuery } from '@tanstack/react-query'
import { totalQuery } from '../sql/total'

export function useTableRowCount({
  database,
  schema,
  table,
  enforceExactCount,
  filters,
}: {
  database: typeof databases.$inferSelect
  schema: string
  table: string
  enforceExactCount?: boolean
  filters?: ActiveFilter[]
}) {
  return useQuery({
    queryKey: ['database', database.id, 'schema', schema, 'table', table, 'total', enforceExactCount, filters],
    queryFn: () =>
      totalQuery.run(database, {
        schema,
        table,
        enforceExactCount,
        filters,
      }),
  })
}
