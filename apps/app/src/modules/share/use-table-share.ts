import { SyncType } from '@tamery/shared/enums/sync-type'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { sharesQueryOptions } from './shares-query'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const useTableShare = (schema: string, table: string) => {
  const { connection, connectionResource } = useRouteContext()
  const { data: shares = [] } = useQuery(sharesQueryOptions)

  return {
    count: shares.length,
    share:
      shares.find(
        (entry) =>
          entry.connectionResourceId === connectionResource.id &&
          entry.schema === schema &&
          entry.table === table
      ) ?? null,
    synced: connection.syncType === SyncType.Cloud,
  }
}
