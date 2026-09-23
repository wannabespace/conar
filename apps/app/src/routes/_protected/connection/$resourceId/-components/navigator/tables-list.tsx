import {
  AppWindowIcon,
  ArrowRight01Icon,
  Copy01Icon,
  Delete02Icon,
  LayoutTable02Icon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
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
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { CSSProperties, ComponentRef, ReactNode } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import { Link } from '~/components/link'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import type { tablesAndSchemasType } from '~/entities/connection/queries/tables/list'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { pinnedTable } from '~/entities/connection/store/helpers/tables'
import { openTableTab } from '~/entities/connection/store/helpers/tabs'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { parseTabId, tableTabId } from '~/entities/connection/store/tabs/ids'
import { openNewWindow } from '~/lib/new-window'

import { tableSessionStore } from '../../-tabs/table/-lib/session-store'
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
  table: LayoutTable02Icon,
  view: ViewIcon,
  'materialized view': ViewIcon,
} satisfies Record<TableInfo['type'], IconSvgElement>

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
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
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
  const router = useRouter()
  const tabId = tableTabId(row.schema, row.table.name)
  const isActive = useParams({
    select: (params) => params.tabId === tabId,
    strict: false,
  })
  const isReadOnly = row.table.type !== 'table'
  const Icon = tableTypeIcon[row.table.type]
  const store = tableSessionStore({
    id: connectionResource.id,
    schema: row.schema,
    table: row.table.name,
  })
  const hasDrafts = useSubscription(store, {
    selector: (state) => Object.keys(state.drafts).length > 0,
  })

  const openInNewWindow = () => {
    openTableTab(connectionResource.id, row.schema, row.table.name)

    openNewWindow(
      router.buildLocation({
        params: { resourceId: connectionResource.id, tabId },
        to: '/connection/$resourceId/$tabId',
      }).href
    )
  }

  const items: AppMenuNode[] = [
    {
      label: 'Open in New Window',
      icon: AppWindowIcon,
      onSelect: openInNewWindow,
    },
    { type: 'separator' },
    {
      label: 'Copy Name',
      icon: Copy01Icon,
      onSelect: () => copyToClipboard(row.table.name, 'Table name copied'),
    },
    {
      label: row.pinned ? 'Unpin' : 'Pin',
      icon: row.pinned ? PinOffIcon : PinIcon,
      onSelect: () =>
        pinnedTable.toggle(connectionResource.id, row.schema, row.table.name),
    },
    { type: 'separator' },
    {
      label: 'Rename',
      icon: PencilEdit01Icon,
      disabled: isReadOnly,
      onSelect: onRename,
    },
    {
      label: 'Drop',
      icon: Delete02Icon,
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
          `text-foreground hover:text-foreground data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground h-7 cursor-default rounded-md pl-2 text-sm`,
          row.pinned && 'pr-8'
        )}
        render={
          <Link
            to="/connection/$resourceId/$tabId"
            params={{
              resourceId: connectionResource.id,
              tabId,
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
          <HugeiconsIcon
            icon={Icon}
            strokeWidth={2}
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
            row.pinned
              ? `group-hover/menu-item:mask-[linear-gradient(to_right,#000_calc(100%-3.25rem),transparent_calc(100%-1rem))]`
              : `group-hover/menu-item:mask-[linear-gradient(to_right,#000_calc(100%-4.75rem),transparent_calc(100%-2.5rem))]`
          )}
        >
          <HighlightText text={row.table.name} match={search} />
        </span>
      </SidebarMenuButton>
      <AppMenuButton
        items={items}
        contentProps={{ className: 'min-w-48' }}
        render={
          <SidebarMenuAction
            showOnHover
            className={cn(
              'hover:bg-foreground/10 top-1! right-6 rounded-md',
              isActive &&
                'text-primary-foreground/80! hover:bg-primary-foreground/20 hover:text-primary-foreground!'
            )}
          />
        }
      />
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
                pinnedTable.toggle(
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
              <HugeiconsIcon
                icon={PinIcon}
                strokeWidth={2}
                className={cn(
                  'size-3! group-hover/pin:hidden',
                  isActive ? 'text-primary-foreground' : 'text-primary'
                )}
              />
              <HugeiconsIcon
                icon={PinOffIcon}
                strokeWidth={2}
                className={cn(
                  'hidden size-3! group-hover/pin:block',
                  isActive ? 'text-primary-foreground' : 'text-foreground'
                )}
              />
            </>
          ) : (
            <HugeiconsIcon
              icon={PinIcon}
              strokeWidth={2}
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
      className={cn('scroll-fade block overflow-y-auto pb-2 pl-2', className)}
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
