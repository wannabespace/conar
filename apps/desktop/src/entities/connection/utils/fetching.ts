import type { ActiveFilter } from '@conar/shared/filters'
import type { connections } from '~/drizzle'
import { queryClient } from '~/main'
import { connectionTableColumnsQuery } from '../queries/columns'
import { connectionConstraintsQuery } from '../queries/constraints'
import { connectionEnumsQuery } from '../queries/enums'
import { connectionRowsQuery } from '../queries/rows'
import { connectionTablesAndSchemasQuery } from '../queries/tables-and-schemas'
import { connectionTableTotalQuery } from '../queries/total'

export async function prefetchConnectionCore(connection: typeof connections.$inferSelect) {
  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return
  }

  await Promise.all([
    queryClient.prefetchQuery(connectionTablesAndSchemasQuery({ connection })),
    queryClient.prefetchQuery(connectionEnumsQuery({ connection })),
    queryClient.prefetchQuery(connectionConstraintsQuery({ connection })),
  ])
}

export async function prefetchConnectionTableCore({ connection, schema, table, query }: {
  connection: typeof connections.$inferSelect
  schema: string
  table: string
  query: {
    filters: ActiveFilter[]
    orderBy: Record<string, 'ASC' | 'DESC'>
  }
}) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery(connectionRowsQuery({ connection, table, schema, query })),
    queryClient.prefetchQuery(connectionTableTotalQuery({ connection, table, schema, query })),
    queryClient.prefetchQuery(connectionTableColumnsQuery({ connection, table, schema })),
  ])
}
