import type { ActiveFilter } from '@conar/shared/filters'
import type { Connection, ConnectionResource } from '~/entities/connection/sync'
import { SyncType } from '@conar/shared/enums/sync-type'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { queryClient } from '~/main'
import { isLocalProxyAvailable } from '../proxy'
import { resourceRowsQueryInfiniteOptions } from '../queries'
import { resourceTableColumnsQueryOptions } from '../queries/columns'
import { resourceConstraintsQueryOptions } from '../queries/constraints'
import { resourceEnumsQueryOptions } from '../queries/enums'
import { resourceTablesAndSchemasQueryOptions } from '../queries/tables-and-schemas'
import { resourceTableTotalQueryOptions } from '../queries/total'
import { getConnectionResourceStore } from '../store'
import { connectionsCollection } from '../sync'

export async function prefetchConnectionResourceCore(connectionResource: ConnectionResource) {
  const connection = connectionsCollection.get(connectionResource.connectionId)!
  const info = connectionStringStorage.get(connection.id)

  if (connection.passwordExists && !info?.isPasswordPopulated) {
    return
  }

  const store = getConnectionResourceStore(connectionResource.id)
  await Promise.all([
    queryClient.prefetchQuery(resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem: store.get().showSystem })),
    queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource })),
    queryClient.prefetchQuery(resourceConstraintsQueryOptions({ connectionResource })),
  ])
}

interface FetchingConnectionInfo {
  isPasswordPopulated?: boolean
  isLocalhost?: boolean
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

type FetchingConnection = Pick<Connection, 'syncType' | 'passwordExists'> & { id?: string }

export function fetchingConfig(connection: FetchingConnection, options?: {
  isLocalProxyAvailable?: boolean
  proxy?: { enabled: boolean, url: string | null }
  info?: FetchingConnectionInfo
}): {
  type: 'cloud-proxy' | 'local' | 'proxy' | 'waiting-for-password'
  canSend: boolean
} {
  const info = options?.info ?? (connection.id ? connectionStringStorage.get(connection.id) : undefined)
  const isPasswordPopulated = info?.isPasswordPopulated ?? false
  const isLocalhost = info?.isLocalhost ?? false

  if (connection.passwordExists && !isPasswordPopulated) {
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

  return { type: 'cloud-proxy', canSend: true }
}
