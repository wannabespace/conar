import type { WhereFilter } from '@conar/shared/sql/where'
import type { databases } from '~/drizzle'
import { queryClient } from '~/main'
import { databaseTableColumnsQuery } from '../queries/columns'
import { databaseTableConstraintsQuery } from '../queries/constraints'
import { tablesAndSchemasQuery } from '../queries/context'
import { databaseEnumsQuery } from '../queries/enums'
import { databaseRowsQuery } from '../queries/rows'
import { databaseTableTotalQuery } from '../queries/total'

export async function prefetchDatabaseCore(database: typeof databases.$inferSelect) {
  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return
  }

  const [tablesAndSchemas] = await Promise.all([
    queryClient.ensureQueryData(tablesAndSchemasQuery({ database })),
    queryClient.prefetchQuery(databaseEnumsQuery({ database })),
  ])

  // This approach is needed to launch prefetch, but without overloading the database
  for (const schemaAndTables of tablesAndSchemas.schemas) {
    for (const table of schemaAndTables.tables) {
      await queryClient.prefetchQuery(databaseTableColumnsQuery({ database, table, schema: schemaAndTables.name }))
      await queryClient.prefetchQuery(databaseTableConstraintsQuery({ database, table, schema: schemaAndTables.name }))
    }
  }
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
