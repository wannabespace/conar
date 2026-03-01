import type { ActiveFilter } from '@conar/shared/filters'
import type { connectionsResources } from '~/drizzle'
import { queryClient } from '~/main'
import { resourceTableColumnsQuery } from '../queries/columns'
import { resourceConstraintsQuery } from '../queries/constraints'
import { resourceEnumsQuery } from '../queries/enums'
import { resourceRowsQuery } from '../queries/rows'
import { resourceTablesAndSchemasQuery } from '../queries/tables-and-schemas'
import { resourceTableTotalQuery } from '../queries/total'
import { getConnectionResourceStore } from '../store'
import { connectionsCollection } from '../sync'

export async function prefetchConnectionResourceCore(connectionResource: typeof connectionsResources.$inferSelect) {
  const connection = connectionsCollection.get(connectionResource.connectionId)!

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return
  }

  const store = getConnectionResourceStore(connectionResource.id)
  await Promise.all([
    queryClient.prefetchQuery(resourceTablesAndSchemasQuery({ connectionResource, showSystem: store.state.showSystem })),
    queryClient.prefetchQuery(resourceEnumsQuery({ connectionResource })),
    queryClient.prefetchQuery(resourceConstraintsQuery({ connectionResource })),
  ])
}

export async function prefetchConnectionResourceTableCore({ connectionResource, schema, table, query }: {
  connectionResource: typeof connectionsResources.$inferSelect
  schema: string
  table: string
  query: {
    filters: ActiveFilter[]
    orderBy: Record<string, 'ASC' | 'DESC'>
    exact: boolean
  }
}) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery(resourceRowsQuery({ connectionResource, table, schema, query })),
    queryClient.prefetchQuery(resourceTableTotalQuery({ connectionResource, table, schema, query })),
    queryClient.prefetchQuery(resourceTableColumnsQuery({ connectionResource, table, schema })),
  ])
}
