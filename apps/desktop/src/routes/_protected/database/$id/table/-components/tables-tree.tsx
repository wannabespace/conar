import type { ComponentRef, HTMLAttributes } from 'react'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownSLine, RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'motion/react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { SidebarLink } from '~/components/sidebar-link'
import { useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { addTab, cleanupPinnedTables, connectionStore, togglePinTable } from '~/entities/connection/store'
import { Route } from '..'
import { DropTableDialog } from './drop-table-dialog'
import { RenameTableDialog } from './rename-table-dialog'

type TableTreeRow
  = | { type: 'header', key: string, schema: string, count: number }
    | { type: 'table', key: string, schema: string, table: string, pinned: boolean }
    | { type: 'separator', key: string }

const ROW_HEIGHTS: Record<TableTreeRow['type'], number> = {
  header: 40,
  table: 34,
  separator: 17,
}

const MotionSeparator = motion.create(Separator)

const treeVariants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0 },
}

const treeTransition = {
  layout: { duration: 0.15, ease: 'easeInOut' as const },
  opacity: { duration: 0.1 },
  height: { duration: 0.1 },
}

const VIEWPORT_PADDING_TOP = 12

function SkeletonLoader() {
  return (
    <div className="h-full space-y-3 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`skeleton-row-${i}`}
          className="flex h-5 items-center gap-2 px-2"
        >
          <div className="h-full w-5 animate-pulse rounded-md bg-muted" />
          <div className="h-full animate-pulse rounded-md bg-muted" style={{ width: `${50 + Math.random() * 30}%` }} />
        </div>
      ))}
    </div>
  )
}

function NoTablesPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8">
      <RiTableLine className="mb-2 size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No tables found</p>
    </div>
  )
}

const SchemaHeader = memo(function SchemaHeader({
  schema,
  isOpen,
  isActive,
  onToggle,
}: {
  schema: string
  isOpen: boolean
  isActive: boolean
  onToggle: VoidFunction
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="
        group flex w-full cursor-pointer items-center gap-2 rounded-md p-2
        text-left text-sm font-medium
        hover:bg-accent/50
      "
    >
      <RiStackLine className={cn('size-4 shrink-0 opacity-50 transition-colors', isActive && `
        text-primary opacity-100
      `)}
      />
      <span className="flex-1 truncate">{schema}</span>
      <RiArrowDownSLine className={cn(`
        size-4 shrink-0 text-muted-foreground transition-transform
      `, isOpen && `rotate-180`)}
      />
    </button>
  )
})

const TableItem = memo(function TableItem({
  schema,
  table,
  pinned,
  search,
  onRename,
  onDrop,
}: {
  schema: string
  table: string
  pinned: boolean
  search?: string
  onRename: VoidFunction
  onDrop: VoidFunction
}) {
  const { connection } = Route.useRouteContext()

  return (
    <SidebarLink
      to="/database/$id/table"
      params={{ id: connection.id }}
      search={{ schema, table }}
      preloadDelay={200}
      onDoubleClick={() => addTab(connection.id, schema, table)}
      className="group pl-4"
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <RiTableLine className={cn(`
            size-4 shrink-0 opacity-50 transition-colors
          `, isActive && `text-primary opacity-100`)}
          />
          <span className="truncate">
            <HighlightText text={table} match={search} />
          </span>

          <div className="
            ml-auto flex items-center gap-1 opacity-0 transition-opacity
            group-hover:opacity-100
            focus-within:opacity-100
          "
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                togglePinTable(connection.id, schema, table)
              }}
            >
              {pinned
                ? <RiPushpinFill className="size-3 text-primary" />
                : (
                    <RiPushpinLine className="size-3" />
                  )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" onClick={e => e.stopPropagation()}>
                  <RiMoreLine className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48" onCloseAutoFocus={e => e.preventDefault()}>
                <DropdownMenuItem onClick={() => copyToClipboard(table, 'Table name copied')}>
                  <RiFileCopyLine className="size-4" />
                  Copy Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRename}>
                  <RiEditLine className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDrop}>
                  <RiDeleteBin7Line className="size-4" />
                  Drop
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </SidebarLink>
  )
})

export function TablesTree({ className, search }: Pick<HTMLAttributes<HTMLDivElement>, 'className'> & { search?: string }) {
  const { connection } = Route.useRouteContext()
  const { data: tablesAndSchemas, isPending } = useConnectionTablesAndSchemas({ connection })
  const { schema: activeSchema } = useSearch({ from: '/_protected/database/$id/table/' })
  const store = connectionStore(connection.id)
  const openedSchemas = useStore(store, s => s.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'])
  const pinnedTables = useStore(store, s => s.pinnedTables)
  const dropRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(connection.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [connection, tablesAndSchemas])

  const openedSet = useMemo(() => new Set(search ? tablesAndSchemas?.schemas.map(s => s.name) : openedSchemas), [tablesAndSchemas, search, openedSchemas])

  const tableVirtualRows = useMemo(() => {
    if (!tablesAndSchemas)
      return []

    const pinnedSet = new Set(pinnedTables.map(t => `${t.schema}:${t.table}`))
    const lowerSearch = search?.toLowerCase()
    const result: TableTreeRow[] = []

    for (const schema of tablesAndSchemas.schemas) {
      const tables = schema.tables
        .filter(t => !lowerSearch || t.toLowerCase().includes(lowerSearch))
        .toSorted((a, b) => a.localeCompare(b))

      if (!tables.length)
        continue

      result.push({
        type: 'header',
        key: `h:${schema.name}`,
        schema: schema.name,
        count: tables.length,
      })

      if (openedSet.has(schema.name)) {
        const pinned = []
        const unpinned = []

        for (const table of tables) {
          if (pinnedSet.has(`${schema.name}:${table}`))
            pinned.push(table)
          else unpinned.push(table)
        }

        pinned.forEach(t => result.push({ type: 'table', key: `${schema.name}:${t}`, schema: schema.name, table: t, pinned: true }))
        if (pinned.length && unpinned.length)
          result.push({ type: 'separator', key: `s:${schema.name}` })
        unpinned.forEach(t => result.push({ type: 'table', key: `${schema.name}:${t}`, schema: schema.name, table: t, pinned: false }))
      }
    }
    return result
  }, [tablesAndSchemas, pinnedTables, search, openedSet])

  const rowVirtualizer = useVirtualizer({
    count: tableVirtualRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: rowId => ROW_HEIGHTS[tableVirtualRows[rowId]?.type ?? 'table'],
    getItemKey: rowId => tableVirtualRows[rowId]?.key ?? rowId,
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const scrollOffset = rowVirtualizer.scrollOffset ?? 0
  let stickyState: { row: Extract<TableTreeRow, { type: 'header' }>, transform: number } | null = null

  if (virtualItems.length) {
    const currentItem = virtualItems.find(item => item.start + item.size > scrollOffset) ?? virtualItems[0]
    let activeIndex = -1

    for (let i = currentItem?.index ?? 0; i >= 0; i--) {
      if (tableVirtualRows[i]?.type === 'header') {
        activeIndex = i
        break
      }
    }

    if (activeIndex !== -1) {
      const activeRow = tableVirtualRows[activeIndex]
      if (activeRow?.type === 'header') {
        const visibleActiveItem = virtualItems.find(item => item.index === activeIndex)
        const shouldStick = !visibleActiveItem || scrollOffset > visibleActiveItem.start + VIEWPORT_PADDING_TOP

        if (shouldStick) {
          let transform = 0
          const nextHeaderItem = virtualItems.find(item =>
            item.index > activeIndex && tableVirtualRows[item.index]?.type === 'header',
          )

          if (nextHeaderItem) {
            const distance = (nextHeaderItem.start + VIEWPORT_PADDING_TOP) - scrollOffset
            if (distance < ROW_HEIGHTS.header)
              transform = distance - ROW_HEIGHTS.header
          }

          stickyState = { row: activeRow, transform }
        }
      }
    }
  }

  const toggleSchema = (name: string) => {
    if (search)
      return

    store.setState((s) => {
      const current = s.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public']
      return {
        ...s,
        tablesTreeOpenedSchemas: current.includes(name)
          ? current.filter(schemaName => schemaName !== name)
          : current.concat(name),
      }
    })
  }

  if (isPending) {
    return <SkeletonLoader />
  }

  if (!tableVirtualRows.length) {
    return <NoTablesPlaceholder />
  }

  return (
    <ScrollArea className={cn('relative h-full', className)}>
      <DropTableDialog ref={dropRef} />
      <RenameTableDialog ref={renameRef} />

      {stickyState && (
        <div
          className="
            absolute inset-x-0 top-0 z-20 h-10 border-b border-border/40
            bg-background px-2
          "
          style={{
            transform: `translateY(${stickyState.transform}px)`,
          }}
        >
          <SchemaHeader
            schema={stickyState.row.schema}
            isOpen={openedSet.has(stickyState.row.schema)}
            isActive={activeSchema === stickyState.row.schema}
            onToggle={() => toggleSchema(stickyState.row.schema)}
          />
        </div>
      )}

      <ScrollViewport ref={scrollRef} className="relative px-2 pt-3 pb-2">
        <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = tableVirtualRows[virtualRow.index]
            if (!row)
              return null

            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 w-full"
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  top: 0,
                }}
              >
                {row.type === 'header' && (
                  <SchemaHeader
                    schema={row.schema}
                    isOpen={openedSet.has(row.schema)}
                    isActive={activeSchema === row.schema}
                    onToggle={() => toggleSchema(row.schema)}
                  />
                )}
                {row.type === 'table' && (
                  <motion.div
                    layout
                    variants={treeVariants}
                    initial="hidden"
                    animate="visible"
                    transition={treeTransition}
                  >
                    <TableItem
                      schema={row.schema}
                      table={row.table}
                      pinned={row.pinned}
                      search={search}
                      onRename={() => renameRef.current?.rename(row.schema, row.table)}
                      onDrop={() => dropRef.current?.drop(row.schema, row.table)}
                    />
                  </motion.div>
                )}
                {row.type === 'separator' && (
                  <MotionSeparator
                    className="my-2 h-px!"
                    layout
                    variants={treeVariants}
                    initial="hidden"
                    animate="visible"
                    transition={treeTransition}
                  />
                )}
              </div>
            )
          })}
        </div>
      </ScrollViewport>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}
