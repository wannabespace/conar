import { enabledFilters } from '@tamery/shared/filters'
import { useIsFetching } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { TabRefreshButton } from '~/components/tab-refresh-button'
import { resourceConstraintsQueryOptions } from '~/core/queries/constraints/list'
import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTableTotalQueryKey } from '~/core/queries/rows/total'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { queryClient } from '~/lib/query-client'

import { tablePageStore } from '../lib/store'
import type { TableParams } from '../lib/tab'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const TableRefresh = ({
  params: { schema, table },
}: {
  params: TableParams
}) => {
  const { connectionResource } = useRouteContext()
  const store = tablePageStore({ id: connectionResource.id, schema, table })
  const { filters, orderBy } = useSubscription(store, {
    selector: (state) => ({
      filters: enabledFilters(state.filters),
      orderBy: state.orderBy,
    }),
  })

  const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
    connectionResource,
    query: { filters, orderBy },
    schema,
    table,
  })
  const isFetching = useIsFetching({ queryKey: rowsQueryOpts.queryKey }) > 0
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    return Promise.all([
      queryClient.invalidateQueries(rowsQueryOpts),
      queryClient.invalidateQueries(
        resourceTableColumnsQueryOptions({
          connectionResource,
          schema,
          table,
        })
      ),
      queryClient.invalidateQueries({
        queryKey: resourceTableTotalQueryKey({
          connectionResource,
          schema,
          table,
        }),
      }),
      queryClient.invalidateQueries(
        resourceConstraintsQueryOptions({ connectionResource })
      ),
      queryClient.invalidateQueries(
        resourceEnumsQueryOptions({ connectionResource })
      ),
    ]).finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label="Refresh table"
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}
