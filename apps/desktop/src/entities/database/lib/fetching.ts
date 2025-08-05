import type { WhereFilter } from '@conar/shared/sql/where'
import type { databases } from '~/drizzle'
import { ensureChats } from '~/entities/chat/lib/fetching'
import { drizzleFn, ensureDrizzleQuery, useDrizzleLive } from '~/hooks/use-drizzle-live'
import { queryClient } from '~/main'
import { databaseTableColumnsQuery } from '../queries/columns'
import { tablesAndSchemasQuery } from '../queries/context'
import { databaseEnumsQuery } from '../queries/enums'
import { databasePrimaryKeysQuery } from '../queries/primary-keys'
import { databaseRowsQuery } from '../queries/rows'
import { databaseTableTotalQuery } from '../queries/total'

const databasesFn = drizzleFn(query => query.databases.findMany({
  orderBy: (tables, { desc }) => desc(tables.createdAt),
}))

export function ensureDatabases() {
  return ensureDrizzleQuery(databasesFn)
}

export function useDatabasesLive() {
  return useDrizzleLive({
    fn: databasesFn,
  })
}

function databaseFn(id: string) {
  return drizzleFn(query => query.databases.findFirst({
    where: (tables, { eq }) => eq(tables.id, id),
  }))
}

export function ensureDatabase(id: string) {
  return ensureDrizzleQuery(databaseFn(id))
}

export async function prefetchDatabaseCore(database: typeof databases.$inferSelect) {
  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return ensureDatabase(database.id)
  }

  await Promise.all([
    ensureDatabase(database.id),
    ensureChats(database.id),
    queryClient.prefetchQuery(tablesAndSchemasQuery(database)),
  ])

  await Promise.all([
    queryClient.prefetchQuery(databasePrimaryKeysQuery(database)),
    queryClient.prefetchQuery(databaseEnumsQuery(database)),
  ])
}

export async function prefetchDatabaseTableCore(database: typeof databases.$inferSelect, schema: string, table: string, query: {
  filters: WhereFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
}) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery(databaseRowsQuery(database, table, schema, query)),
    queryClient.prefetchQuery(databaseTableTotalQuery(database, table, schema, query)),
    queryClient.prefetchQuery(databaseTableColumnsQuery(database, table, schema)),
  ])
}
