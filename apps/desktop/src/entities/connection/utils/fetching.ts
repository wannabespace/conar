import type { ActiveFilter } from '@conar/shared/filters'
import type { connectionsResources } from '~/drizzle/schema'
import { queryClient } from '~/main'
import { resourceRowsQueryInfiniteOptions } from '../queries'
import { resourceTableColumnsQueryOptions } from '../queries/columns'
import { resourceConstraintsQueryOptions } from '../queries/constraints'
import { resourceEnumsQueryOptions } from '../queries/enums'
import { resourceTablesAndSchemasQueryOptions } from '../queries/tables-and-schemas'
import { resourceTableTotalQueryOptions } from '../queries/total'
import { getConnectionResourceStore } from '../store'
import { connectionsCollection } from '../sync'

export async function prefetchConnectionResourceCore(connectionResource: typeof connectionsResources.$inferSelect) {
  const connection = connectionsCollection.get(connectionResource.connectionId)!

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return
  }

  const store = getConnectionResourceStore(connectionResource.id)
  await Promise.all([
    queryClient.prefetchQuery(resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem: store.get().showSystem })),
    queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource })),
    queryClient.prefetchQuery(resourceConstraintsQueryOptions({ connectionResource })),
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
    queryClient.prefetchInfiniteQuery(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query })),
    queryClient.prefetchQuery(resourceTableTotalQueryOptions({ connectionResource, table, schema, query })),
    queryClient.prefetchQuery(resourceTableColumnsQueryOptions({ connectionResource, table, schema })),
  ])
}
