import { enabledFilters } from '@tamery/shared/filters'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { partialMatchKey, useIsFetching } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries/constraints/list'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums/list'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import {
  resourceIndexesQueryOptions,
  structureQueryKey,
} from '~/entities/connection/queries/indexes/list'
import { resourcePoliciesQueryOptions } from '~/entities/connection/queries/policies/list'
import { resourcePrivilegesQueryOptions } from '~/entities/connection/queries/privileges/list'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries/rows/list'
import { resourceTableTotalQueryKey } from '~/entities/connection/queries/rows/total'
import {
  resourceColumnsQueryKey,
  resourceTableColumnsQueryOptions,
} from '~/entities/connection/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import type {
  ConnectionTab,
  DefinitionsSection,
} from '~/entities/connection/store/tabs/types'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { queryClient } from '~/lib/query-client'

import { tablePageStore } from '../../-tabs/table/-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TabRefreshButton = ({
  label,
  refreshing,
  onRefresh,
}: {
  label: string
  refreshing: boolean
  onRefresh: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <RefreshButton
          variant="ghost"
          size="icon-xs"
          aria-label="Refresh"
          className="text-muted-foreground"
          iconClassName="size-3.5"
          refreshing={refreshing}
          onClick={onRefresh}
        />
      }
    />
    <TooltipContent side="bottom">
      {label}
      {window.electron && (
        <KbdCtrlLetter userAgent={navigator.userAgent} letter="R" />
      )}
    </TooltipContent>
  </Tooltip>
)

const DEFINITIONS_QUERY_OPTIONS: Record<
  DefinitionsSection,
  (params: { connectionResource: ConnectionResource }) => { queryKey: string[] }
> = {
  constraints: resourceConstraintsQueryOptions,
  enums: resourceEnumsQueryOptions,
  functions: resourceFunctionsQueryOptions,
  indexes: resourceIndexesQueryOptions,
  policies: resourcePoliciesQueryOptions,
  privileges: resourcePrivilegesQueryOptions,
  triggers: resourceTriggersQueryOptions,
}

const DefinitionsRefresh = ({ section }: { section: DefinitionsSection }) => {
  const { connectionResource } = useRouteContext()
  const { queryKey } = DEFINITIONS_QUERY_OPTIONS[section]({
    connectionResource,
  })
  const isFetching = useIsFetching({ queryKey }) > 0
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    // The pickers and "no tables" notes read the table list, not the section.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({
        queryKey: resourceTablesAndSchemasQueryOptions({ connectionResource })
          .queryKey,
      }),
    ]).finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label={`Refresh ${section}`}
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}

const VisualizerRefresh = () => {
  const { connectionResource } = useRouteContext()
  const tablesAndSchemasKey = resourceTablesAndSchemasQueryOptions({
    connectionResource,
  }).queryKey
  const columnsKey = resourceColumnsQueryKey({ connectionResource })
  const structureKey = structureQueryKey(connectionResource)
  const triggersKey = resourceTriggersQueryOptions({
    connectionResource,
  }).queryKey
  const policiesKey = resourcePoliciesQueryOptions({
    connectionResource,
  }).queryKey
  const keys = [
    tablesAndSchemasKey,
    columnsKey,
    structureKey,
    triggersKey,
    policiesKey,
  ]
  const isFetching =
    useIsFetching({
      predicate: (query) =>
        keys.some((key) => partialMatchKey(query.queryKey, key)),
    }) > 0
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    return Promise.all([
      ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          partialMatchKey(queryKey, [
            'connection-resource',
            connectionResource.id,
          ]) && queryKey.includes('total'),
      }),
    ]).finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label="Refresh diagram"
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}

const TableRefresh = ({ schema, table }: { schema: string; table: string }) => {
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
    table,
    schema,
    query: { filters, orderBy },
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
          table,
          schema,
        })
      ),
      queryClient.invalidateQueries({
        queryKey: resourceTableTotalQueryKey({
          connectionResource,
          table,
          schema,
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

export const TabRefresh = ({ tab }: { tab: ConnectionTab | null }) => {
  if (tab?.type === 'table') {
    return <TableRefresh schema={tab.schema} table={tab.table} />
  }

  if (tab?.type === 'definitions') {
    return <DefinitionsRefresh section={tab.section} />
  }

  if (tab?.type === 'visualizer') {
    return <VisualizerRefresh />
  }

  return (
    <RefreshButton
      variant="ghost"
      size="icon-xs"
      aria-label="Refresh"
      className="text-muted-foreground"
      iconClassName="size-3.5"
      refreshing={false}
      disabled
    />
  )
}
