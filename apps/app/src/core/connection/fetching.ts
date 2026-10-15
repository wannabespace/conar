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

/** A query sent while the connection is blocked fails, and its cached error outlives the unlock. */
export const canQueryConnection = (connection: Connection) =>
  fetchingConfig(connection, {
    connectionString:
      getCollections().connectionStringsCollection.get(connection.id) ?? null,
    proxy: getConnectionStore(connection.id).get().proxy,
  }).canSend

export const prefetchConnectionResourceCore = async (
  connectionResource: ConnectionResource
) => {
  const connection = getCollections().connectionsCollection.get(
    connectionResource.connectionId
  )

  if (!(connection && canQueryConnection(connection))) {
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
  const [rows = []] =
    (await Promise.all([
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
    ]).catch(noop)) ?? []
  return rows
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
    connectionString: connectionString ?? null,
    isLocalProxyAvailable: localProxyAvailable,
    proxy,
  })
}
