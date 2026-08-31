import type { ActiveFilter } from '@tamery/shared/filters'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useSubscription } from 'seitu/react'

import { getCollections, useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import { queryClient } from '~/main'

import { resourceRowsQueryInfiniteOptions } from '../queries'
import { resourceTableColumnsQueryOptions } from '../queries/columns'
import { resourceConstraintsQueryOptions } from '../queries/constraints'
import { resourceEnumsQueryOptions } from '../queries/enums'
import { resourceTablesAndSchemasQueryOptions } from '../queries/tables-and-schemas'
import { resourceTableTotalQueryOptions } from '../queries/total'
import { useLocalProxyAvailable } from '../runtime/proxy'
import { getConnectionResourceStore, getConnectionStore } from '../store'
import { fetchingConfig } from './fetching-config'

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

  const store = getConnectionResourceStore(connectionResource.id)
  await Promise.all([
    queryClient.prefetchQuery(
      resourceTablesAndSchemasQueryOptions({
        connectionResource,
        showSystem: store.get().showSystem,
      })
    ),
    queryClient.prefetchQuery(
      resourceEnumsQueryOptions({ connectionResource })
    ),
    queryClient.prefetchQuery(
      resourceConstraintsQueryOptions({ connectionResource })
    ),
  ])
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
    queryClient.prefetchInfiniteQuery(
      resourceRowsQueryInfiniteOptions({
        connectionResource,
        query,
        schema,
        table,
      })
    ),
    queryClient.prefetchQuery(
      resourceTableTotalQueryOptions({
        connectionResource,
        query,
        schema,
        table,
      })
    ),
    queryClient.prefetchQuery(
      resourceTableColumnsQueryOptions({ connectionResource, schema, table })
    ),
  ])
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

  return {
    ...fetchingConfig(connection, {
      isLocalProxyAvailable: localProxyAvailable,
      isLocalhost: connectionString?.isLocalhost,
      isPasswordPopulated: connectionString?.isPasswordPopulated,
      proxy,
    }),
    // The record is local-only and rebuilt by a server round-trip, so a missing
    // row means "not resolved yet", never "no stored password" — a connection
    // that truly needs one has a row saying `isPasswordPopulated: false`.
    // Without this, `waiting-for-password` is a verdict drawn from ignorance.
    isPasswordStateKnown: !!connectionString,
  }
}
