import {
  FolderAddIcon,
  LayoutTable02Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { Separator } from '@tamery/ui/components/separator'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { CSSProperties, ComponentRef, ReactNode } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { tableTabId } from '~/core/tabs/ids'

import { createSchemaDialogRef } from './create-schema-dialog'
import { DropSchemaDialog } from './drop-schema-dialog'
import { DropTableDialog } from './drop-table-dialog'
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

export const TablesList = ({
  className,
  onCreateTable,
  search,
}: {
  className?: string
  onCreateTable: (schema?: string) => void
  search?: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = navigatorStore(connectionResource.id)
  const { data: tablesAndSchemas, isPending } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
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
  const stickyRow = rows
    .slice(0, (range?.startIndex ?? -1) + 1)
    .findLast((row) => row.kind === 'schema')

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

  if (isPending) {
    return (
      <SidebarContent className={cn('overflow-hidden pl-2', className)}>
        <SidebarMenu>
          {Array.from({ length: 12 }).map((_, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <SidebarMenuItem key={index}>
              <SidebarMenuSkeleton seed={index} showIcon />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    )
  }

  if (rows.length === 0) {
    return (
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
    )
  }

  const renderSchemaRow = (row: Extract<TreeRow, { kind: 'schema' }>) => (
    <div className="h-full pt-0.5 pb-1">
      <SchemaRow
        row={row}
        onCreateTable={() => onCreateTable(row.name)}
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

  return (
    <div
      className={cn('relative flex flex-col', className)}
      style={{ '--sticky-height': `${ROW_HEIGHTS.schema}px` } as CSSProperties}
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

            let rowContent: ReactNode
            if (row.kind === 'schema') {
              rowContent = renderSchemaRow(row)
            } else if (row.kind === 'empty') {
              rowContent = (
                <p className="text-muted-foreground flex h-full items-center pb-0.5 pl-2 text-xs">
                  No tables
                </p>
              )
            } else if (row.kind === 'new-schema') {
              rowContent = (
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
            } else if (row.kind === 'separator') {
              rowContent = (
                <div className="flex h-full items-center">
                  <Separator className="mx-2 w-full" />
                </div>
              )
            } else {
              rowContent = (
                <div className="pb-0.5">
                  <TableRow
                    row={row}
                    search={search}
                    onRename={() =>
                      renameTableDialogRef.current?.rename(
                        row.schema,
                        row.table.name
                      )
                    }
                    onDrop={() =>
                      dropTableDialogRef.current?.drop(
                        row.schema,
                        row.table.name
                      )
                    }
                  />
                </div>
              )
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
                style={
                  { '--row-height': `${virtualRow.size}px` } as CSSProperties
                }
              >
                {rowContent}
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
          <li className="group/menu-item h-(--sticky-height)">
            {renderSchemaRow(stickyRow)}
          </li>
        </SidebarMenu>
      )}
    </div>
  )
}
