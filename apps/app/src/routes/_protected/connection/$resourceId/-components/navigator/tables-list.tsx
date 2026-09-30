import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
import { Separator } from '@tamery/ui/components/separator'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { defaultRangeExtractor } from '@tanstack/react-virtual'
import { motion } from 'motion/react'
import type { CSSProperties, ComponentRef, ReactNode } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { pinnedTable } from '~/entities/connection/store/helpers/tables'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { tableTabId } from '~/entities/connection/store/tabs/ids'

import { DropTableDialog } from './drop-table-dialog'
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './primitives'
import { RenameTableDialog } from './rename-table-dialog'
import { SchemaRow } from './schema-row'
import { TableRow } from './table-row'
import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ROW_HEIGHTS = {
  schema: 32,
  table: 30,
  separator: 13,
} satisfies Record<TreeRow['kind'], number>

export const TablesList = ({
  className,
  onCreateTable,
  search,
}: {
  className?: string
  onCreateTable: (schema: string) => void
  search?: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
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
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
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

  const pinnedSet = new Set(pinnedTables.map((t) => `${t.schema}:${t.table}`))
  const rows: TreeRow[] = []

  for (const schema of tablesAndSchemas?.schemas ?? []) {
    const tables = schema.tables
      .filter((table) => matchesSearch(search, table.name))
      .toSorted((a, b) => a.name.localeCompare(b.name))

    if (tables.length === 0) {
      continue
    }

    const open =
      !showSchemaRows || !!search || openedSchemas.includes(schema.name)

    if (showSchemaRows) {
      rows.push({
        kind: 'schema',
        id: `schema:${schema.name}`,
        name: schema.name,
        open,
      })
    }

    if (!open) {
      continue
    }

    const pinned = tables.filter((table) =>
      pinnedSet.has(`${schema.name}:${table.name}`)
    )
    const unpinned = tables.filter(
      (table) => !pinnedSet.has(`${schema.name}:${table.name}`)
    )

    for (const table of pinned) {
      rows.push({
        kind: 'table',
        id: `table:${schema.name}:${table.name}`,
        schema: schema.name,
        table,
        pinned: true,
      })
    }

    if (pinned.length > 0 && unpinned.length > 0) {
      rows.push({ kind: 'separator', id: `separator:${schema.name}` })
    }

    for (const table of unpinned) {
      rows.push({
        kind: 'table',
        id: `table:${schema.name}:${table.name}`,
        schema: schema.name,
        table,
        pinned: false,
      })
    }
  }

  const schemaIndexes = rows.flatMap((row, index) =>
    row.kind === 'schema' ? [index] : []
  )
  const stickyIndexAt = (startIndex: number) =>
    schemaIndexes.findLast((index) => index <= startIndex)

  const { virtualItems, totalSize, scrollToIndex, range } = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      return row ? ROW_HEIGHTS[row.kind] : ROW_HEIGHTS.table
    },
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: 12,
    rangeExtractor: (visibleRange) => {
      const indexes = defaultRangeExtractor(visibleRange)
      const stickyIndex = stickyIndexAt(visibleRange.startIndex)

      return stickyIndex === undefined || indexes.includes(stickyIndex)
        ? indexes
        : [stickyIndex, ...indexes]
    },
  })
  const stickyIndex = range ? stickyIndexAt(range.startIndex) : undefined

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
        <p className="text-muted-foreground text-sm">No tables found</p>
      </SidebarContent>
    )
  }

  return (
    <SidebarContent
      ref={parentRef}
      className={cn(
        'scroll-fade block overflow-y-auto pb-2 pl-2',
        stickyIndex !== undefined &&
          'mask-add! [--scroll-fade-mask:linear-gradient(to_bottom,#000_var(--sticky-height),transparent_var(--sticky-height)),linear-gradient(to_bottom,transparent_var(--sticky-height),#000_calc(var(--sticky-height)+var(--scroll-fade-t)),#000_calc(100%-var(--scroll-fade-b)),transparent_100%)] [-webkit-mask-composite:source-over]!',
        className
      )}
      style={{ '--sticky-height': `${ROW_HEIGHTS.schema}px` } as CSSProperties}
    >
      <DropTableDialog ref={dropTableDialogRef} />
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
            rowContent = (
              <div className="h-full pt-0.5 pb-1">
                <SchemaRow
                  row={row}
                  onCreateTable={() => onCreateTable(row.name)}
                  onToggle={() => toggleSchema(row.name)}
                />
              </div>
            )
          } else if (row.kind === 'separator') {
            rowContent = (
              <div className="flex h-full items-center">
                <Separator className="bg-border mx-2 w-full" />
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
                    dropTableDialogRef.current?.drop(row.schema, row.table.name)
                  }
                />
              </div>
            )
          }

          if (virtualRow.index === stickyIndex) {
            return (
              <li
                key={virtualRow.key}
                className="group/menu-item bg-body sticky top-0 z-10 h-(--row-height) backdrop-blur-md"
                style={
                  { '--row-height': `${virtualRow.size}px` } as CSSProperties
                }
              >
                {rowContent}
              </li>
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
  )
}
