import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { dialects, invalidatesCatalog, writesData } from '@tamery/sql'

import type { ConnectionResource } from '~/core/connection/sync'
import { resourceColumnsQueryKey } from '~/core/queries/tables/columns'
import { queryClient } from '~/lib/query-client'

export const refreshAfterRun = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType,
  text: string
) => {
  if (invalidatesCatalog(text, dialects[connectionType])) {
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id],
    })
    queryClient.removeQueries({
      queryKey: resourceColumnsQueryKey({ connectionResource }),
      type: 'inactive',
    })
  } else if (writesData(text, dialects[connectionType])) {
    // Sync with resourceRowsQueryKey and resourceTableTotalQueryKey: every row-data key starts with this prefix.
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id, 'schema'],
    })
  }
}
