import { SyncType } from '@tamery/shared/enums/sync-type'
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
import { isLocalProxyAvailable, useLocalProxyAvailable } from '../runtime/proxy'
import { getConnectionResourceStore, getConnectionStore } from '../store'

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

const waitingForPasswordConfig = (): {
  type: 'waiting-for-password'
  canSend: false
  reason: string
} => ({
  canSend: false,
  reason: window.electron
    ? 'Filled password is required to query this connection.'
    : 'This connection cannot be used from the web app because it was created without storing the password. Open this connection in the desktop app.',
  type: 'waiting-for-password',
})

const cloudProxyConfig = (
  connection: Pick<Connection, 'syncType'>
): {
  type: 'cloud-proxy'
  canSend: boolean
  reason: string | null
} => {
  const canSend = connection.syncType !== SyncType.CloudWithoutPassword

  return {
    canSend,
    reason: canSend
      ? null
      : 'You cannot reach this connection from the web app. Open this connection in the desktop app.',
    type: 'cloud-proxy',
  }
}

const isPasswordFilledForConnection = (
  connection: Pick<Connection, 'syncType'>,
  isPasswordPopulated: boolean
) =>
  (connection.syncType === SyncType.CloudWithoutPassword &&
    isPasswordPopulated) ||
  connection.syncType === SyncType.Cloud

const resolveReachableConfig = ({
  connection,
  hasCustomUrl,
  isLocalhost,
  isPasswordFilled,
  preferProxy,
  proxyAvailable,
}: {
  connection: Pick<Connection, 'syncType'>
  hasCustomUrl: boolean
  isLocalhost: boolean
  isPasswordFilled: boolean
  preferProxy: boolean
  proxyAvailable: boolean
}): {
  type: 'cloud-proxy' | 'local' | 'proxy'
  canSend: boolean
  reason: string | null
} => {
  if (
    (isLocalhost || isPasswordFilled) &&
    (proxyAvailable || hasCustomUrl) &&
    preferProxy
  ) {
    return { canSend: true, reason: null, type: 'proxy' }
  }

  if (window.electron) {
    return { canSend: true, reason: null, type: 'local' }
  }

  if (isLocalhost) {
    return {
      canSend: false,
      reason:
        'You cannot reach this connection from the web app. Run `tamery proxy` or open this connection in the desktop app.',
      type: 'proxy',
    }
  }

  return cloudProxyConfig(connection)
}

export const fetchingConfig = (
  connection: Pick<Connection, 'syncType' | 'isPasswordExists'>,
  options?: {
    isLocalProxyAvailable?: boolean
    isPasswordPopulated?: boolean
    isLocalhost?: boolean
    proxy?: { enabled: boolean; url: string | null }
  }
): {
  type: 'cloud-proxy' | 'local' | 'proxy' | 'waiting-for-password'
  canSend: boolean
  reason: string | null
} => {
  const isPasswordPopulated = options?.isPasswordPopulated ?? false
  const isLocalhost = options?.isLocalhost ?? false

  if (connection.isPasswordExists && !isPasswordPopulated) {
    return waitingForPasswordConfig()
  }

  return resolveReachableConfig({
    connection,
    hasCustomUrl: !!options?.proxy?.url,
    isLocalhost,
    isPasswordFilled: isPasswordFilledForConnection(
      connection,
      isPasswordPopulated
    ),
    preferProxy: !window.electron || options?.proxy?.enabled === true,
    proxyAvailable: options?.isLocalProxyAvailable ?? isLocalProxyAvailable(),
  })
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
