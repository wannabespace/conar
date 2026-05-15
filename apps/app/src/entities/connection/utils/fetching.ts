import type { ActiveFilter } from '@conar/shared/filters'
import type { connections, connectionsResources } from '~/drizzle/schema'
import { isLocalhostConnectionString } from '@conar/connection/utils'
import { SyncType } from '@conar/shared/enums/sync-type'
import { tryCatch } from '@conar/shared/utils/helpers'
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

type FetchingConnection = Pick<typeof connections.$inferSelect, 'syncType' | 'connectionString' | 'isPasswordExists' | 'isPasswordPopulated'>

export function fetchingConfig(connection: FetchingConnection, options?: {
  isLocalProxyAvailable?: boolean
  proxy?: { enabled: boolean, url: string | null }
}): {
  type: 'cloud-proxy' | 'local' | 'proxy' | 'waiting-for-password'
  canSend: boolean
} {
  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return { type: 'waiting-for-password', canSend: false }
  }

  const isLocalhost = tryCatch(() => isLocalhostConnectionString(connection.connectionString)).data === true
  const isPasswordFilled = (connection.syncType === SyncType.CloudWithoutPassword && connection.isPasswordPopulated)
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
