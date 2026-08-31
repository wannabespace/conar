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
import { CONNECTION_TYPES_WITHOUT_SCHEMAS } from '@tamery/shared/constants'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { Indicator } from '@tamery/ui/components/custom/indicator'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ComponentRef, ReactNode } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import { Link } from '~/components/link'
import type { tablesAndSchemasType } from '~/entities/connection/queries'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import {
  openTableTab,
  parseTabId,
  tableTabId,
  cleanupPinnedTables,
  getConnectionResourceStore,
  togglePinTable,
} from '~/entities/connection/store'

import { tablePageStore } from '../../-tabs/table/-lib/store'
import { DropTableDialog } from './drop-table-dialog'
import {
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './primitives'
import { RenameTableDialog } from './rename-table-dialog'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface TableInfo {
  name: string
  type: (typeof tablesAndSchemasType.infer)['type']
}

type TreeRow =
  | {
      kind: 'schema'
      id: string
      name: string
      open: boolean
      tablesCount: number
    }
  | {
      kind: 'table'
      id: string
      schema: string
      table: TableInfo
      pinned: boolean
    }
  | { kind: 'separator'; id: string }

const ROW_HEIGHTS = {
  schema: 32,
  table: 30,
  separator: 13,
} satisfies Record<TreeRow['kind'], number>

const tableTypeIcon = {
  table: RiTableLine,
  view: RiEyeLine,
  'materialized view': RiEyeFill,
} satisfies Record<TableInfo['type'], RemixiconComponentType>

const tableTypeLabel = {
  table: 'Table',
  view: 'View',
  'materialized view': 'Materialized view',
} satisfies Record<TableInfo['type'], string>

const useActiveTable = () => {
  const { tabId } = useParams({ strict: false })
  const tab = tabId ? parseTabId(tabId) : null

  return tab?.type === 'table' ? tab : null
}

const SchemaRow = ({
  row,
  onToggle,
}: {
  row: Extract<TreeRow, { kind: 'schema' }>
  onToggle: () => void
}) => {
  const schemaParam = useActiveTable()?.schema

  return (
    <SidebarGroupLabel
      render={
        <button
          type="button"
          aria-label={`Toggle ${row.name} schema`}
          onClick={onToggle}
        />
      }
      className="group hover:bg-accent h-full w-full gap-1 px-1.5"
    >
      <RiArrowRightSLine
        className={cn(
          `text-muted-foreground/70 size-3.5! shrink-0 transition-transform duration-150 ease-out`,
          row.open && 'rotate-90'
        )}
      />
      <span
        className={cn(
          'text-2xs truncate font-semibold tracking-wider uppercase',
          schemaParam === row.name && 'text-foreground'
        )}
      >
        {row.name}
      </span>
      <span className="text-2xs text-muted-foreground/50 ml-auto pr-1 tabular-nums opacity-0 group-hover:opacity-100">
        {row.tablesCount}
      </span>
    </SidebarGroupLabel>
  )
}

const TableRow = ({
  row,
  search,
  onRename,
  onDrop,
}: {
  row: Extract<TreeRow, { kind: 'table' }>
  search?: string
  onRename: () => void
  onDrop: () => void
}) => {
  const { connectionResource } = useRouteContext()
  const activeTable = useActiveTable()
  const isActive =
    activeTable?.schema === row.schema && activeTable?.table === row.table.name
  const isReadOnly = row.table.type !== 'table'
  const Icon = tableTypeIcon[row.table.type]
  const store = tablePageStore({
    id: connectionResource.id,
    schema: row.schema,
    table: row.table.name,
  })
  const hasDrafts = useSubscription(store, {
    selector: (state) => state.drafts.length > 0,
  })

  const items: AppMenuNode[] = [
    {
      label: 'Copy Name',
      icon: <RiFileCopyLine className="size-4" />,
      onSelect: () => copyToClipboard(row.table.name, 'Table name copied'),
    },
    {
      label: row.pinned ? 'Unpin' : 'Pin',
      icon: row.pinned ? (
        <RiPushpinFill className="size-4" />
      ) : (
        <RiPushpinLine className="size-4" />
      ),
      onSelect: () =>
        togglePinTable(connectionResource.id, row.schema, row.table.name),
    },
    { type: 'separator' },
    {
      label: 'Rename',
      icon: <RiEditLine className="size-4" />,
      disabled: isReadOnly,
      onSelect: onRename,
    },
    {
      label: 'Drop',
      icon: <RiDeleteBin7Line className="size-4" />,
      variant: 'destructive',
      disabled: isReadOnly,
      onSelect: onDrop,
    },
  ]

  return (
    <AppContextMenu
      items={items}
      className="block h-full"
      contentProps={{ className: 'min-w-48' }}
    >
      <SidebarMenuButton
        isActive={isActive}
        className={cn(
          `text-foreground hover:text-foreground data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground h-7 cursor-default rounded-md pl-2 text-sm font-[450] data-active:font-[450]`,
          row.pinned && 'pr-8'
        )}
        render={
          <Link
            to="/connection/$resourceId/$tabId"
            params={{
              resourceId: connectionResource.id,
              tabId: tableTabId(row.schema, row.table.name),
            }}
            preload="intent"
            preloadDelay={200}
            data-mask
            onClick={() =>
              openTableTab(
                connectionResource.id,
                row.schema,
                row.table.name,
                true
              )
            }
            onDoubleClick={() =>
              openTableTab(connectionResource.id, row.schema, row.table.name)
            }
          />
        }
      >
        <span
          className="relative shrink-0"
          title={tableTypeLabel[row.table.type]}
        >
          <Icon
            className={cn(
              'size-4',
              isActive ? 'text-primary-foreground' : 'text-primary/75'
            )}
          />
          {hasDrafts && (
            <Indicator
              className={cn(
                '-top-0.5 -right-0.5 size-1.5',
                isActive && 'bg-primary-foreground'
              )}
            />
          )}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            !row.pinned &&
              `group-hover/menu-item:mask-[linear-gradient(to_right,#000_calc(100%-3.5rem),transparent_calc(100%-1.25rem))]`
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
                'group/pin hover:bg-foreground/10 top-1! rounded-md',
                isActive && 'hover:bg-primary-foreground/20'
              )}
              onClick={() =>
                togglePinTable(
                  connectionResource.id,
                  row.schema,
                  row.table.name
                )
              }
            />
          }
        >
          {row.pinned ? (
            <>
              <RiPushpinFill
                className={cn(
                  'size-3! group-hover/pin:hidden',
                  isActive ? 'text-primary-foreground' : 'text-primary'
                )}
              />
              <RiUnpinLine
                className={cn(
                  'hidden size-3! group-hover/pin:block',
                  isActive ? 'text-primary-foreground' : 'text-foreground'
                )}
              />
            </>
          ) : (
            <RiPushpinLine
              className={cn(
                'size-3!',
                isActive
                  ? 'text-primary-foreground/80 group-hover/pin:text-primary-foreground'
                  : 'text-muted-foreground group-hover/pin:text-foreground'
              )}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {row.pinned ? 'Unpin' : 'Pin'}
        </TooltipContent>
      </Tooltip>
    </AppContextMenu>
  )
}

export const TablesList = ({
  className,
  search,
}: {
  className?: string
  search?: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data: tablesAndSchemas, isPending } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
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

  const showSchemaRows = !CONNECTION_TYPES_WITHOUT_SCHEMAS.includes(
    connection.type
  )

  useEffect(() => {
    if (!tablesAndSchemas) {
      return
    }

    cleanupPinnedTables(
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
      .filter(
        (table) =>
          !search || table.name.toLowerCase().includes(search.toLowerCase())
      )
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
        tablesCount: tables.length,
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

  const { virtualItems, totalSize, scrollToIndex } = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      return row ? ROW_HEIGHTS[row.kind] : ROW_HEIGHTS.table
    },
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: 12,
  })

  const activeTable = useActiveTable()
  const schemaParam = activeTable?.schema
  const tableParam = activeTable?.table
  const scrollToActiveEvent = useEffectEvent(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    const index = rows.findIndex(
      (row) =>
        row.kind === 'table' &&
        row.schema === schemaParam &&
        row.table.name === tableParam
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
              <SidebarMenuSkeleton showIcon />
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
        <RiTableLine className="text-muted-foreground/50 mb-2 size-8" />
        <p className="text-muted-foreground text-sm">No tables found</p>
      </SidebarContent>
    )
  }

  return (
    <SidebarContent
      ref={parentRef}
      className={cn('scroll-fade block overflow-y-auto pb-2 pl-2', className)}
    >
      <DropTableDialog ref={dropTableDialogRef} />
      <RenameTableDialog ref={renameTableDialogRef} />
      <SidebarMenu
        data-mask
        className="relative w-full gap-0"
        style={{ height: totalSize }}
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
                <SchemaRow row={row} onToggle={() => toggleSchema(row.name)} />
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
              className="group/menu-item absolute inset-x-0 top-0"
              style={{ height: `${virtualRow.size}px` }}
            >
              {rowContent}
            </motion.li>
          )
        })}
      </SidebarMenu>
    </SidebarContent>
  )
}
