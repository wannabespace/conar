import type { ActiveFilter } from '@conar/shared/filters'
import type { Connection, ConnectionResource } from '~/entities/connection/sync'
import { SyncType } from '@conar/shared/enums/sync-type'
import { useSubscription } from 'seitu/react'
import { getCollections } from '~/lib/collections'
import { connectionStringStorage, useConnectionStringMetadata } from '~/lib/connection-string-storage'
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
  const { connectionsCollection } = getCollections()
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  const connectionString = connectionStringStorage.get(connection.id)

  if (connection.isPasswordExists && !connectionString?.metadata?.isPasswordPopulated) {
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
} {
  const isPasswordPopulated = options?.isPasswordPopulated ?? false
  const isLocalhost = options?.isLocalhost ?? false

  if (connection.isPasswordExists && !isPasswordPopulated) {
    return { type: 'waiting-for-password', canSend: false }
  }

  const isPasswordFilled = (connection.syncType === SyncType.CloudWithoutPassword && isPasswordPopulated)
    || connection.syncType === SyncType.Cloud
  const proxyAvailable = options?.isLocalProxyAvailable ?? isLocalProxyAvailable()
  const proxyEnabled = options?.proxy?.enabled === true
  const hasCustomUrl = !!options?.proxy?.url
  const preferProxy = !window.electron || proxyEnabled

  if ((isLocalhost || isPasswordFilled) && (proxyAvailable || hasCustomUrl) && preferProxy) {
    return { type: 'proxy', canSend: true }
  }

  if (window.electron) {
    return { type: 'local', canSend: true }
  }

  if (isLocalhost) {
    return { type: 'proxy', canSend: false }
  }

  return { type: 'cloud-proxy', canSend: connection.syncType !== SyncType.CloudWithoutPassword }
}

export function useFetchingConfig(connection: Pick<Connection, 'id' | 'syncType' | 'isPasswordExists'>) {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const metadata = useConnectionStringMetadata(connection.id)
  const proxy = useSubscription(getConnectionStore(connection.id), { selector: s => s.proxy })

  return fetchingConfig(connection, {
    isLocalProxyAvailable,
    isPasswordPopulated: metadata?.isPasswordPopulated,
    isLocalhost: metadata?.isLocalhost,
    proxy,
  })
}
