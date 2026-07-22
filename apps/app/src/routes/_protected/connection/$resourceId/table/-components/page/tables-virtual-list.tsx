import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiArrowRightSLine,
  RiDeleteBin7Line,
  RiEditLine,
  RiEyeFill,
  RiEyeLine,
  RiFileCopyLine,
  RiPushpinFill,
  RiPushpinLine,
  RiTableLine,
  RiUnpinLine,
} from '@remixicon/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { Indicator } from '@tamery/ui/components/custom/indicator'
import { Separator } from '@tamery/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'motion/react'
import type { ComponentRef } from 'react'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { tablesAndSchemasType } from '~/entities/connection/queries'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import {
  addTab,
  cleanupPinnedTables,
  getConnectionResourceStore,
  togglePinTable,
} from '~/entities/connection/store'

import { tablePageStore } from '../../-lib/store'
import { DropTableDialog } from '../drop-table-dialog'
import { RenameTableDialog } from '../rename-table-dialog'
import {
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './sidebar-primitives'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface TableInfo {
  name: string
  type: (typeof tablesAndSchemasType.infer)['type']
}

type TreeRow =
  | { kind: 'schema'; id: string; name: string; open: boolean; tablesCount: number }
  | { kind: 'table'; id: string; schema: string; table: TableInfo; pinned: boolean }
  | { kind: 'separator'; id: string }

const ROW_HEIGHTS: Record<TreeRow['kind'], number> = {
  schema: 32,
  table: 30,
  separator: 13,
}

const tableTypeIcon: Record<TableInfo['type'], RemixiconComponentType> = {
  'table': RiTableLine,
  'view': RiEyeLine,
  'materialized view': RiEyeFill,
}

const tableTypeLabel: Record<TableInfo['type'], string> = {
  'table': 'Table',
  'view': 'View',
  'materialized view': 'Materialized view',
}

function SchemaRow({ row, onToggle }: { row: TreeRow & { kind: 'schema' }; onToggle: () => void }) {
  const { schema: schemaParam } = useSearch({ strict: false })

  return (
    <SidebarGroupLabel
      render={<button type="button" aria-label={`Toggle ${row.name} schema`} onClick={onToggle} />}
      className={`
        group h-full w-full cursor-default gap-1 px-1.5
        hover:bg-accent/50
      `}
    >
      <RiArrowRightSLine
        className={cn(
          `
            size-3.5! shrink-0 text-muted-foreground/70 transition-transform
            duration-150 ease-out
          `,
          row.open && 'rotate-90',
        )}
      />
      <span
        className={cn(
          'truncate text-2xs font-semibold tracking-wider uppercase',
          schemaParam === row.name && 'text-foreground',
        )}
      >
        {row.name}
      </span>
      <span
        className={`
          ml-auto pr-1 text-2xs text-muted-foreground/50 tabular-nums
          opacity-0 transition-opacity duration-150
          group-hover:opacity-100
        `}
      >
        {row.tablesCount}
      </span>
    </SidebarGroupLabel>
  )
}

function TableRow({
  row,
  search,
  onRename,
  onDrop,
}: {
  row: TreeRow & { kind: 'table' }
  search?: string
  onRename: () => void
  onDrop: () => void
}) {
  const { connectionResource } = useRouteContext()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const isActive = schemaParam === row.schema && tableParam === row.table.name
  const isReadOnly = row.table.type !== 'table'
  const Icon = tableTypeIcon[row.table.type]
  const store = tablePageStore({
    id: connectionResource.id,
    schema: row.schema,
    table: row.table.name,
  })
  const hasDrafts = useSubscription(store, { selector: state => state.drafts.length > 0 })

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">
        <SidebarMenuButton
          isActive={isActive}
          className={cn(
            `
              h-7 cursor-default rounded-md pl-2 text-sm font-[450]
              text-foreground
              hover:text-foreground data-active:bg-primary
              data-active:font-[450]
              data-active:text-primary-foreground hover:data-active:bg-primary
              hover:data-active:text-primary-foreground
            `,
            row.pinned && 'pr-8',
          )}
          render={
            <Link
              to="/connection/$resourceId/table"
              params={{ resourceId: connectionResource.id }}
              search={{ schema: row.schema, table: row.table.name }}
              preload="intent"
              preloadDelay={200}
              data-mask
              onDoubleClick={() => addTab(connectionResource.id, row.schema, row.table.name)}
            />
          }
        >
          <span className="relative shrink-0" title={tableTypeLabel[row.table.type]}>
            <Icon
              className={cn('size-4', isActive ? 'text-primary-foreground' : 'text-primary/75')}
            />
            {hasDrafts && (
              <Indicator
                className={cn('-top-0.5 -right-0.5 size-1.5', isActive && 'bg-primary-foreground')}
              />
            )}
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              !row.pinned &&
                `
                group-hover/menu-item:mask-[linear-gradient(to_right,#000_calc(100%-3.5rem),transparent_calc(100%-1.25rem))]
              `,
            )}
          >
            <HighlightText text={row.table.name} match={search} />
          </span>
        </SidebarMenuButton>
        <Tooltip>
          <TooltipTrigger
            render={
              <SidebarMenuAction
                showOnHover={!row.pinned}
                aria-label={row.pinned ? 'Unpin table' : 'Pin table'}
                className={cn(
                  'group/pin top-1! rounded-md hover:bg-foreground/10',
                  isActive && 'hover:bg-primary-foreground/20',
                )}
                onClick={() => togglePinTable(connectionResource.id, row.schema, row.table.name)}
              />
            }
          >
            {row.pinned ? (
              <>
                <RiPushpinFill
                  className={cn(
                    'size-3! group-hover/pin:hidden',
                    isActive ? 'text-primary-foreground' : 'text-primary',
                  )}
                />
                <RiUnpinLine
                  className={cn(
                    'hidden size-3! group-hover/pin:block',
                    isActive ? 'text-primary-foreground' : 'text-foreground',
                  )}
                />
              </>
            ) : (
              <RiPushpinLine
                className={cn(
                  'size-3!',
                  isActive
                    ? 'text-primary-foreground/80 group-hover/pin:text-primary-foreground'
                    : 'text-muted-foreground group-hover/pin:text-foreground',
                )}
              />
            )}
          </TooltipTrigger>
          <TooltipContent side="right">{row.pinned ? 'Unpin' : 'Pin'}</TooltipContent>
        </Tooltip>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        <ContextMenuItem onClick={() => copyToClipboard(row.table.name, 'Table name copied')}>
          <RiFileCopyLine className="size-4" />
          Copy Name
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => togglePinTable(connectionResource.id, row.schema, row.table.name)}
        >
          {row.pinned ? <RiPushpinFill className="size-4" /> : <RiPushpinLine className="size-4" />}
          {row.pinned ? 'Unpin' : 'Pin'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={isReadOnly} onClick={onRename}>
          <RiEditLine className="size-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem disabled={isReadOnly} variant="destructive" onClick={onDrop}>
          <RiDeleteBin7Line className="size-4" />
          Drop
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function TablesVirtualList({ className, search }: { className?: string; search?: string }) {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data: tablesAndSchemas, isPending } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }),
  )
  const pinnedTables = useSubscription(store, { selector: state => state.pinnedTables })
  const openedSchemas = useSubscription(store, {
    selector: state =>
      state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'],
  })
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  // ClickHouse has a single flat namespace — no schema group rows
  const showSchemaRows = connection.type !== ConnectionType.ClickHouse

  useEffect(() => {
    if (!tablesAndSchemas) return

    cleanupPinnedTables(
      connectionResource.id,
      tablesAndSchemas.schemas.flatMap(schema =>
        schema.tables.map(table => ({ schema: schema.name, table: table.name })),
      ),
    )
  }, [connectionResource, tablesAndSchemas])

  const rows = useMemo<TreeRow[]>(() => {
    if (!tablesAndSchemas) return []

    const pinnedSet = new Set(pinnedTables.map(t => `${t.schema}:${t.table}`))
    const result: TreeRow[] = []

    for (const schema of tablesAndSchemas.schemas) {
      const tables = schema.tables
        .filter(table => !search || table.name.toLowerCase().includes(search.toLowerCase()))
        .toSorted((a, b) => a.name.localeCompare(b.name))

      if (tables.length === 0) continue

      const open = !showSchemaRows || !!search || openedSchemas.includes(schema.name)

      if (showSchemaRows) {
        result.push({
          kind: 'schema',
          id: `schema:${schema.name}`,
          name: schema.name,
          open,
          tablesCount: tables.length,
        })
      }

      if (!open) continue

      const pinned = tables.filter(table => pinnedSet.has(`${schema.name}:${table.name}`))
      const unpinned = tables.filter(table => !pinnedSet.has(`${schema.name}:${table.name}`))

      for (const table of pinned) {
        result.push({
          kind: 'table',
          id: `table:${schema.name}:${table.name}`,
          schema: schema.name,
          table,
          pinned: true,
        })
      }

      if (pinned.length > 0 && unpinned.length > 0) {
        result.push({ kind: 'separator', id: `separator:${schema.name}` })
      }

      for (const table of unpinned) {
        result.push({
          kind: 'table',
          id: `table:${schema.name}:${table.name}`,
          schema: schema.name,
          table,
          pinned: false,
        })
      }
    }

    return result
  }, [tablesAndSchemas, search, pinnedTables, openedSchemas, showSchemaRows])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: index => ROW_HEIGHTS[rows[index]!.kind],
    getItemKey: index => rows[index]!.id,
    overscan: 12,
  })

  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const scrollToActiveEvent = useEffectEvent(() => {
    if (!schemaParam || !tableParam) return

    const index = rows.findIndex(
      row => row.kind === 'table' && row.schema === schemaParam && row.table.name === tableParam,
    )

    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: 'auto' })
    }
  })

  const hasData = rows.length > 0

  // Reveal the active table once the tree is loaded (e.g. on page reload)
  useEffect(() => {
    if (hasData) scrollToActiveEvent()
  }, [hasData])

  function toggleSchema(name: string) {
    store.set(
      state =>
        ({
          ...state,
          tablesTreeOpenedSchemas: openedSchemas.includes(name)
            ? openedSchemas.filter(schema => schema !== name)
            : [...openedSchemas, name],
        }) satisfies typeof state,
    )
  }

  if (isPending) {
    return (
      <SidebarContent className={cn('overflow-hidden px-2', className)}>
        <SidebarMenu>
          {Array.from({ length: 12 }).map((_, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <SidebarMenuItem key={index}>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    )
  }

  if (rows.length === 0) {
    return (
      <SidebarContent className={cn('items-center justify-center py-8 text-center', className)}>
        <RiTableLine className="mb-2 size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No tables found</p>
      </SidebarContent>
    )
  }

  return (
    <SidebarContent
      ref={parentRef}
      className={cn('block scroll-fade overflow-y-auto px-2 pb-2', className)}
    >
      <DropTableDialog ref={dropTableDialogRef} />
      <RenameTableDialog ref={renameTableDialogRef} />
      <SidebarMenu
        data-mask
        className="relative w-full gap-0"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]!

          return (
            // motion.li instead of SidebarMenuItem: rows are keyed by stable
            // row id (virtualizer getItemKey), so animating `y` to the row's
            // list offset makes pin/unpin reorders glide to their new slot.
            // `y` only changes on reorder — scrolling moves the container, so
            // this never runs during scroll.
            <motion.li
              key={virtualRow.key}
              initial={false}
              animate={{ y: virtualRow.start }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="group/menu-item absolute inset-x-0 top-0"
              style={{ height: `${virtualRow.size}px` }}
            >
              {row.kind === 'schema' ? (
                <div className="h-full pt-0.5 pb-1">
                  <SchemaRow row={row} onToggle={() => toggleSchema(row.name)} />
                </div>
              ) : row.kind === 'separator' ? (
                <div className="flex h-full items-center">
                  <Separator className={cn('mx-2 w-full bg-border', className)} />
                </div>
              ) : (
                <div className="pb-0.5">
                  <TableRow
                    row={row}
                    search={search}
                    onRename={() =>
                      renameTableDialogRef.current?.rename(row.schema, row.table.name)
                    }
                    onDrop={() => dropTableDialogRef.current?.drop(row.schema, row.table.name)}
                  />
                </div>
              )}
            </motion.li>
          )
        })}
      </SidebarMenu>
    </SidebarContent>
  )
}
