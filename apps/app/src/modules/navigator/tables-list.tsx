import {
  FolderAddIcon,
  LayoutTable02Icon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { CSSProperties, ComponentRef } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'

import { createSchemaDialogRef } from './create-schema-dialog'
import { createViewDialogRef } from './create-view-dialog'
import { DropSchemaDialog } from './drop-schema-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { useNavigatorSearch } from './keyboard'
import { pinnedTable } from './pinned-tables'
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './primitives'
import { RenameSchemaDialog } from './rename-schema-dialog'
import { RenameTableDialog } from './rename-table-dialog'
import { SchemaRow } from './schema-row'
import { navigatorStore } from './stores'
import { TableRow } from './table-row'
import { buildTreeRows } from './tree-row'
import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ROW_HEIGHTS = {
  empty: 30,
  'new-schema': 44,
  schema: 32,
  separator: 13,
  table: 30,
} satisfies Record<TreeRow['kind'], number>

const isNavigable = (row: TreeRow) =>
  row.kind === 'schema' || row.kind === 'table' || row.kind === 'new-schema'

export const TablesList = ({
  className,
  onCreateTable,
}: {
  className?: string
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
  const dropSchemaDialogRef =
    useRef<ComponentRef<typeof DropSchemaDialog>>(null)
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameSchemaDialogRef =
    useRef<ComponentRef<typeof RenameSchemaDialog>>(null)
  const renameTableDialogRef =
    useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

  const { virtualItems, totalSize, scrollToIndex, range } = useVirtualizer({
    count: rows.length,
    estimateSize: (index) => {
      const row = rows[index]
      return row ? ROW_HEIGHTS[row.kind] : ROW_HEIGHTS.table
    },
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => parentRef.current,
    overscan: 12,
  })
  const stickyRow =
    range &&
    rows.findLast(
      (row, index) => row.kind === 'schema' && index <= range.startIndex
    )

  const router = useRouter()
  const scrollToActiveEvent = useEffectEvent(() => {
    const params = router.state.matches.at(-1)?.params
    const tabId = params && 'tabId' in params ? params.tabId : undefined
    const index = rows.findIndex(
      (row) =>
        row.kind === 'table' && tableTabId(row.schema, row.table.name) === tabId
    )

    if (index !== -1) {
      scrollToIndex(index, { align: 'auto' })
    }
  })

  const hasData = rows.length > 0

  useEffect(() => {
    if (hasData) {
      scrollToActiveEvent()
    }
  }, [hasData])

  const deferredSearch = useDeferredValue(search)
  const isSearchSettled = deferredSearch === search

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

  const openRow = (id: string) => {
    const row = rows.find((candidate) => candidate.id === id)

    if (row?.kind === 'schema') {
      toggleSchema(row.name)
    } else if (row?.kind === 'new-schema') {
      createSchemaDialogRef.current?.create()
    } else if (row?.kind === 'table') {
      const tabId = tableTabId(row.schema, row.table.name)
      openTab(connectionResource.id, tabId, true)
      router.navigate({
        params: { resourceId: connectionResource.id, tabId },
        to: '/connection/$resourceId/$tabId',
      })
    }
  }

  const { highlightedId, searchProps } = useNavigatorSearch({
    activeId: rows.find(
      (row) =>
        row.kind === 'table' &&
        tableTabId(row.schema, row.table.name) === activeTabId
    )?.id,
    ids: rows.filter(isNavigable).map((row) => row.id),
    listRef,
    onClear: () => setSearch(''),
    onOpen: openRow,
    onReveal: (id) =>
      scrollToIndex(
        rows.findIndex((row) => row.id === id),
        { align: 'auto' }
      ),
    search,
  })

  const header = (
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
  )

  if (isPending) {
    return (
      <>
        {header}
        <SidebarContent className={cn('overflow-hidden pl-2', className)}>
          <SidebarMenu>
            {Array.from({ length: 12 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuSkeleton seed={index} showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </>
    )
  }

  if (rows.length === 0) {
    return (
      <>
        {header}
        <SidebarContent
          className={cn(
            'items-center justify-center py-8 text-center',
            className
          )}
        >
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
      </>
    )
  }

  const rowContentOf = (row: TreeRow) => {
    if (row.kind === 'schema') {
      return (
        <div className="h-full pt-0.5 pb-1">
          <SchemaRow
            row={row}
            onCreateTable={() => onCreateTable(row.name)}
            onCreateView={() => createViewDialogRef.current?.create(row.name)}
            onDrop={() => dropSchemaDialogRef.current?.drop(row.name)}
            onRename={
              capabilitiesOf(connection.type).renameSchema
                ? () => renameSchemaDialogRef.current?.rename(row.name)
                : undefined
            }
            onToggle={() => toggleSchema(row.name)}
          />
        </div>
      )
    }

    if (row.kind === 'empty') {
      return (
        <p className="text-muted-foreground flex h-full items-center pb-0.5 pl-2 text-xs">
          No tables
        </p>
      )
    }

    if (row.kind === 'new-schema') {
      return (
        <div className="pt-4">
          <SidebarMenuButton
            className="text-muted-foreground"
            onClick={() => createSchemaDialogRef.current?.create()}
          >
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
            <span>New schema</span>
          </SidebarMenuButton>
        </div>
      )
    }

    if (row.kind === 'separator') {
      return (
        <div className="flex h-full items-center">
          <Separator className="mx-2 w-full" />
        </div>
      )
    }

    return (
      <div className="pb-0.5">
        <TableRow
          row={row}
          search={search}
          onRename={
            row.table.type === 'table' ||
            capabilitiesOf(connection.type).renameViews
              ? () =>
                  renameTableDialogRef.current?.rename(
                    row.schema,
                    row.table.name,
                    row.table.type
                  )
              : undefined
          }
          onDrop={() =>
            dropTableDialogRef.current?.drop(
              row.schema,
              row.table.name,
              row.table.type
            )
          }
        />
      </div>
    )
  }

  return (
    <>
      {header}
      <div
        ref={listRef}
        className={cn('relative flex flex-col', className)}
        style={
          { '--sticky-height': `${ROW_HEIGHTS.schema}px` } as CSSProperties
        }
      >
        <SidebarContent
          ref={parentRef}
          className={cn(
            'scroll-fade block flex-1 overflow-y-auto pb-2 pl-2',
            stickyRow &&
              '[--scroll-fade-mask:linear-gradient(to_bottom,transparent_var(--sticky-height),#000_calc(var(--sticky-height)+var(--scroll-fade-t)),#000_calc(100%-var(--scroll-fade-b)),transparent_100%)]!'
          )}
        >
          <DropSchemaDialog ref={dropSchemaDialogRef} />
          <DropTableDialog ref={dropTableDialogRef} />
          <RenameSchemaDialog ref={renameSchemaDialogRef} />
          <RenameTableDialog ref={renameTableDialogRef} />
          <SidebarMenu
            data-mask
            className="relative h-(--total-size) w-full gap-0"
            style={{ '--total-size': `${totalSize}px` } as CSSProperties}
          >
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index]
              if (!row) {
                return null
              }

              return (
                <motion.li
                  key={virtualRow.key}
                  initial={false}
                  animate={{ y: virtualRow.start }}
                  transition={
                    search || !isSearchSettled
                      ? { duration: 0 }
                      : { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
                  }
                  className="group/menu-item absolute inset-x-0 top-0 h-(--row-height)"
                  inert={row === stickyRow}
                  data-highlighted={
                    (row !== stickyRow && row.id === highlightedId) || undefined
                  }
                  style={
                    { '--row-height': `${virtualRow.size}px` } as CSSProperties
                  }
                >
                  {rowContentOf(row)}
                </motion.li>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        {stickyRow && (
          <SidebarMenu
            data-mask
            className="absolute inset-x-0 top-0 z-10 pl-2"
            onWheel={(event) =>
              parentRef.current?.scrollBy({ top: event.deltaY })
            }
          >
            <SidebarMenuItem
              className="h-(--sticky-height)"
              data-highlighted={stickyRow.id === highlightedId || undefined}
            >
              {rowContentOf(stickyRow)}
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </div>
    </>
  )
}
