import {
  LayoutTable02Icon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@tamery/ui/components/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { tableTabId } from '~/core/tabs/ids'

import { useNavigatorSearch } from './keyboard'
import { pinnedTable } from './pinned-tables'
import { navigatorStore } from './stores'
import { TablesTree } from './tables-tree'
import { buildTreeRows } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const TablesList = ({
  onCreateTable,
}: {
  onCreateTable: (schema?: string) => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const store = navigatorStore(connectionResource.id)
  const search = useSubscription(store, {
    selector: (state) => state.tablesSearch,
  })
  const setSearch = (tablesSearch: string) =>
    store.set((state) => ({ ...state, tablesSearch }) satisfies typeof state)
  const {
    data: tablesAndSchemas,
    isPending,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery(resourceTablesAndSchemasQueryOptions({ connectionResource }))
  const pinnedTables = useSubscription(store, {
    selector: (state) => state.pinnedTables,
  })
  const openedSchemas = useSubscription(store, {
    selector: (state) =>
      state.tablesTreeOpenedSchemas ?? [
        tablesAndSchemas?.schemas[0]?.name ?? 'public',
      ],
  })

  const showSchemaRows = capabilitiesOf(connection.type).schemas

  useEffect(() => {
    if (!tablesAndSchemas) {
      return
    }

    pinnedTable.cleanup(
      connectionResource.id,
      tablesAndSchemas.schemas.flatMap((schema) =>
        schema.tables.map((table) => ({
          schema: schema.name,
          table: table.name,
        }))
      )
    )
  }, [connectionResource, tablesAndSchemas])

  const rows = buildTreeRows({
    openedSchemas,
    pinnedTables,
    schemas: tablesAndSchemas?.schemas ?? [],
    search,
    showSchemaRows,
  })

  const toggleSchema = (name: string) => {
    store.set(
      (state) =>
        ({
          ...state,
          tablesTreeOpenedSchemas: openedSchemas.includes(name)
            ? openedSchemas.filter((schema) => schema !== name)
            : [...openedSchemas, name],
        }) satisfies typeof state
    )
  }

  const activeId = rows.find(
    (row) =>
      row.kind === 'table' &&
      tableTabId(row.schema, row.table.name) === activeTabId
  )?.id

  const { highlightedId, listRef, searchProps } = useNavigatorSearch({
    activeId,
    nodes: rows.filter(
      (row) => row.kind !== 'empty' && row.kind !== 'separator'
    ),
    onClear: () => setSearch(''),
    search,
  })

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 pb-1.5 pl-2">
        <SearchInput
          className="flex-1"
          size="sm"
          data-mask
          placeholder="Search"
          aria-label="Search tables"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          start={
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="text-muted-foreground/70 size-3.5"
            />
          }
          {...searchProps}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <RefreshButton
                variant="outline-muted"
                size="icon-sm"
                onClick={() => refetch()}
                refreshing={isFetching}
              />
            }
          />
          <TooltipContent side="bottom">
            <div className="flex flex-col gap-0.5">
              <span>Refresh tables and schemas</span>
              <span className="opacity-70">
                Last updated:{' '}
                {dataUpdatedAt
                  ? new Date(dataUpdatedAt).toLocaleTimeString()
                  : 'never'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      {isPending && (
        <SidebarContent className="overflow-hidden pl-2">
          <SidebarMenu>
            {Array.from({ length: 12 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuSkeleton seed={index} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      )}
      {!isPending && rows.length === 0 && (
        <SidebarContent className="items-center justify-center py-8 text-center">
          <HugeiconsIcon
            icon={LayoutTable02Icon}
            strokeWidth={2}
            className="text-muted-foreground/50 mb-2 size-8"
          />
          <p className="text-muted-foreground text-sm">
            {search ? 'No tables found' : 'No tables yet'}
          </p>
          {!search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onCreateTable()}
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              New table
            </Button>
          )}
        </SidebarContent>
      )}
      {rows.length > 0 && (
        <TablesTree
          ref={listRef}
          activeId={activeId}
          highlightedId={highlightedId}
          rows={rows}
          search={search}
          onCreateTable={onCreateTable}
          onToggleSchema={toggleSchema}
        />
      )}
    </>
  )
}
