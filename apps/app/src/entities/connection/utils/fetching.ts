import type { ActiveFilter } from '@conar/shared/filters'
import type { Connection, ConnectionResource } from '~/entities/connection/sync'
import { SyncType } from '@conar/shared/enums/sync-type'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useSubscription } from 'seitu/react'
import { getCollections } from '~/lib/collections'
import { queryClient } from '~/main'
import { isLocalProxyAvailable, useLocalProxyAvailable } from '../proxy'
import { resourceRowsQueryInfiniteOptions } from '../queries'
import { resourceTableColumnsQueryOptions } from '../queries/columns'
import { resourceConstraintsQueryOptions } from '../queries/constraints'
import { resourceEnumsQueryOptions } from '../queries/enums'
import { resourceTablesAndSchemasQueryOptions } from '../queries/tables-and-schemas'
import { resourceTableTotalQueryOptions } from '../queries/total'
import { getConnectionResourceStore, getConnectionStore } from '../store'

export async function prefetchConnectionResourceCore(connectionResource: ConnectionResource) {
  const { connectionsCollection, connectionStringsCollection } = getCollections()
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  const connectionString = connectionStringsCollection.get(connection.id)

  if (connection.isPasswordExists && !connectionString?.isPasswordPopulated) {
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
  connectionResource: ConnectionResource
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

export function fetchingConfig(connection: Pick<Connection, 'syncType' | 'isPasswordExists'>, options?: {
  isLocalProxyAvailable?: boolean
  isPasswordPopulated?: boolean
  isLocalhost?: boolean
  proxy?: { enabled: boolean, url: string | null }
}): {
  type: 'cloud-proxy' | 'local' | 'proxy' | 'waiting-for-password'
  canSend: boolean
  reason: string | null
} {
  const isPasswordPopulated = options?.isPasswordPopulated ?? false
  const isLocalhost = options?.isLocalhost ?? false

  if (connection.isPasswordExists && !isPasswordPopulated) {
    return {
      type: 'waiting-for-password',
      canSend: false,
      reason: window.electron
        ? 'Filled password is required to query this connection.'
        : 'This connection cannot be used from the web app because it was created without storing the password. Open this connection in the desktop app.',
    }
  }

  const isPasswordFilled = (connection.syncType === SyncType.CloudWithoutPassword && isPasswordPopulated)
    || connection.syncType === SyncType.Cloud
  const proxyAvailable = options?.isLocalProxyAvailable ?? isLocalProxyAvailable()
  const proxyEnabled = options?.proxy?.enabled === true
  const hasCustomUrl = !!options?.proxy?.url
  const preferProxy = !window.electron || proxyEnabled

  if ((isLocalhost || isPasswordFilled) && (proxyAvailable || hasCustomUrl) && preferProxy) {
    return { type: 'proxy', canSend: true, reason: null }
  }

  if (window.electron) {
    return { type: 'local', canSend: true, reason: null }
  }

  if (isLocalhost) {
    return {
      type: 'proxy',
      canSend: false,
      reason: 'You cannot reach this connection from the web app. Open this connection in the desktop app.',
    }
  }

  const canSend = connection.syncType !== SyncType.CloudWithoutPassword

  return {
    type: 'cloud-proxy',
    canSend,
    reason: canSend
      ? null
      : 'You cannot reach this connection from the web app. Run `conar proxy` or open this connection in the desktop app.',
  }
}

export function useFetchingConfig(connection: Pick<Connection, 'id' | 'syncType' | 'isPasswordExists'>) {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const { connectionStringsCollection } = getCollections()
  const { data: connectionString } = useLiveQuery(q => q
    .from({ cs: connectionStringsCollection })
    .where(({ cs }) => eq(cs.connectionId, connection.id))
    .findOne(), [connection.id])
  const proxy = useSubscription(getConnectionStore(connection.id), { selector: s => s.proxy })

  return fetchingConfig(connection, {
    isLocalProxyAvailable,
    isPasswordPopulated: connectionString?.isPasswordPopulated,
    isLocalhost: connectionString?.isLocalhost,
    proxy,
  })
}
