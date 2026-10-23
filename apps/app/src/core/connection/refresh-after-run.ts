import type { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, invalidatesCatalog, writesData } from '@tamery/sql'

import type { ConnectionResource } from '~/core/connection/sync'
import { resourceColumnsQueryKey } from '~/core/queries/tables/columns'
import { queryClient } from '~/lib/query-client'

export const refreshCatalog = (connectionResource: ConnectionResource) => {
  void queryClient.invalidateQueries({
    queryKey: ['connection-resource', connectionResource.id],
  })
  queryClient.removeQueries({
    queryKey: resourceColumnsQueryKey({ connectionResource }),
    type: 'inactive',
  })
}

export const refreshAfterRun = (
  connectionResource: ConnectionResource,
  dialect: Dialect,
  text: string
) => {
  if (invalidatesCatalog(text, dialects[dialect])) {
    refreshCatalog(connectionResource)
  } else if (writesData(text, dialects[dialect])) {
    // Sync with resourceRowsQueryKey and resourceTableTotalQueryKey: every row-data key starts with this prefix.
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id, 'schema'],
    })
  }
}
