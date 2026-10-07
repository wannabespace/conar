import type { ActiveFilter } from '@tamery/shared/filters'
import { noop } from '@tamery/shared/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useSubscription } from 'seitu/react'

import { getCollections, useCollections } from '~/core/collections'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import { resourceConstraintsQueryOptions } from '~/core/queries/constraints/list'
import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTableTotalQueryOptions } from '~/core/queries/rows/total'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { queryClient } from '~/lib/query-client'

import { fetchingConfig } from './fetching-config'
import { getConnectionStore } from './stores'

export const connectionFetchingConfig = (connection: Connection) => {
  const { connectionStringsCollection } = getCollections()
  const connectionString = connectionStringsCollection.get(connection.id)
  return fetchingConfig(connection, {
    hasLocalConnectionString: !!connectionString,
    isLocalhost: connectionString?.isLocalhost,
    isPasswordPopulated: connectionString?.isPasswordPopulated,
    proxy: getConnectionStore(connection.id).get().proxy,
  })
}

export const prefetchConnectionResourceCore = async (
  connectionResource: ConnectionResource
) => {
  const { connectionsCollection, connectionStringsCollection } =
    getCollections()
  const connection = connectionsCollection.get(connectionResource.connectionId)

  if (!connection) {
    return
  }

  const connectionString = connectionStringsCollection.get(connection.id)

  if (connection.isPasswordExists && !connectionString?.isPasswordPopulated) {
    return
  }

  await Promise.all([
    queryClient.query(
      resourceTablesAndSchemasQueryOptions({ connectionResource })
    ),
    queryClient.query(resourceEnumsQueryOptions({ connectionResource })),
    queryClient.query(resourceConstraintsQueryOptions({ connectionResource })),
  ]).catch(noop)
}

export const prefetchConnectionResourceTableCore = async ({
  connectionResource,
  schema,
  table,
  query,
}: {
  connectionResource: ConnectionResource
  schema: string
  table: string
  query: {
    filters: ActiveFilter[]
    orderBy: Record<string, 'ASC' | 'DESC'>
    exact: boolean
  }
}) => {
  await Promise.all([
    queryClient.infiniteQuery(
      resourceRowsQueryInfiniteOptions({
        connectionResource,
        query,
        schema,
        table,
      })
    ),
    queryClient.query(
      resourceTableTotalQueryOptions({
        connectionResource,
        query,
        schema,
        table,
      })
    ),
    queryClient.query(
      resourceTableColumnsQueryOptions({ connectionResource, schema, table })
    ),
  ]).catch(noop)
}

export const useFetchingConfig = (
  connection: Pick<Connection, 'id' | 'syncType' | 'isPasswordExists'>
) => {
  const localProxyAvailable = useLocalProxyAvailable()
  const { connectionStringsCollection } = useCollections()
  const { data: connectionString } = useLiveQuery({
    query: (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
  })
  const proxy = useSubscription(getConnectionStore(connection.id), {
    selector: (s) => s.proxy,
  })

  return fetchingConfig(connection, {
    hasLocalConnectionString: !!connectionString,
    isLocalProxyAvailable: localProxyAvailable,
    isLocalhost: connectionString?.isLocalhost,
    isPasswordPopulated: connectionString?.isPasswordPopulated,
    proxy,
  })
}
