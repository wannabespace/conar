import type { WhereFilter } from '@conar/shared/sql/where'
import type { databases } from '~/drizzle'
import { queryClient } from '~/main'
import { databaseTableColumnsQuery } from '../queries/columns'
import { databaseTableConstraintsQuery } from '../queries/constraints'
import { tablesAndSchemasQuery } from '../queries/context'
import { databaseEnumsQuery } from '../queries/enums'
import { databaseForeignKeysQuery } from '../queries/foreign-keys'
import { databaseRowsQuery } from '../queries/rows'
import { databaseTableTotalQuery } from '../queries/total'

export async function prefetchDatabaseCore(database: typeof databases.$inferSelect) {
  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return
  }

  await Promise.all([
    queryClient.prefetchQuery(tablesAndSchemasQuery({ database })),
    queryClient.prefetchQuery(databaseEnumsQuery({ database })),
    queryClient.prefetchQuery(databaseForeignKeysQuery({ database })),
  ])
}

export async function prefetchDatabaseTableCore({ database, schema, table, query }: {
  database: typeof databases.$inferSelect
  schema: string
  table: string
  query: {
    filters: WhereFilter[]
    orderBy: Record<string, 'ASC' | 'DESC'>
  }
}) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery(databaseRowsQuery({ database, table, schema, query })),
    queryClient.prefetchQuery(databaseTableTotalQuery({ database, table, schema, query })),
    queryClient.prefetchQuery(databaseTableColumnsQuery({ database, table, schema })),
    queryClient.prefetchQuery(databaseTableConstraintsQuery({ database, table, schema })),
  ])
}
