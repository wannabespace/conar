import { LayoutTable02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
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

import { DropSchemaDialog } from './drop-schema-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { pinnedTable } from './pinned-tables'
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './primitives'
import { RenameSchemaDialog } from './rename-schema-dialog'
import { RenameTableDialog } from './rename-table-dialog'
import { SchemaRow } from './schema-row'
import { navigatorStore } from './stores'
import { TableRow } from './table-row'
import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ROW_HEIGHTS = {
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
  onCreateTable: (schema: string) => void
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
        id: `schema:${schema.name}`,
        kind: 'schema',
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
        id: `table:${schema.name}:${table.name}`,
        kind: 'table',
        pinned: true,
        schema: schema.name,
        table,
      })
    }

    if (pinned.length > 0 && unpinned.length > 0) {
      rows.push({ id: `separator:${schema.name}`, kind: 'separator' })
    }

    for (const table of unpinned) {
      rows.push({
        id: `table:${schema.name}:${table.name}`,
        kind: 'table',
        pinned: false,
        schema: schema.name,
        table,
      })
    }
  }

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
  const stickyRow = range
    ? rows
        .slice(0, range.startIndex + 1)
        .findLast((row) => row.kind === 'schema')
    : undefined

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

  const schemaRowContent = (row: Extract<TreeRow, { kind: 'schema' }>) => (
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
      {stickyRow && (
        <div
          className="group/menu-item absolute inset-x-0 top-0 z-10 h-(--sticky-height) pl-2"
          onWheel={(event) =>
            parentRef.current?.scrollBy({ top: event.deltaY })
          }
        >
          {schemaRowContent(stickyRow)}
        </div>
      )}
      <SidebarContent
        ref={parentRef}
        className={cn(
          'scroll-fade block overflow-y-auto pb-2 pl-2',
          stickyRow &&
            '[--scroll-fade-mask:linear-gradient(to_bottom,transparent_var(--sticky-height),#000_calc(var(--sticky-height)+var(--scroll-fade-t)),#000_calc(100%-var(--scroll-fade-b)),transparent_100%)]'
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
              rowContent = schemaRowContent(row)
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
    </div>
  )
}
