import { FolderAddIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Separator } from '@tamery/ui/components/separator'
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@tamery/ui/components/sidebar'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { CSSProperties, ComponentRef, Ref } from 'react'
import { useDeferredValue, useEffect, useEffectEvent, useRef } from 'react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { tableTabId } from '~/core/tabs/ids'

import { createSchemaDialogRef } from './create-schema-dialog'
import { createViewDialogRef } from './create-view-dialog'
import { DropSchemaDialog } from './drop-schema-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { RenameSchemaDialog } from './rename-schema-dialog'
import { RenameTableDialog } from './rename-table-dialog'
import { SchemaRow } from './schema-row'
import { TableRow } from './table-row'
import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ROW_HEIGHTS = {
  empty: 30,
  'new-schema': 44,
  schema: 32,
  separator: 13,
  table: 30,
} satisfies Record<TreeRow['kind'], number>

export const TablesTree = ({
  className,
  highlightedId,
  onCreateTable,
  onToggleSchema,
  ref,
  rows,
  search,
}: {
  className?: string
  highlightedId?: string
  onCreateTable: (schema?: string) => void
  onToggleSchema: (name: string) => void
  ref: Ref<HTMLDivElement>
  rows: TreeRow[]
  search: string
}) => {
  const { connection } = useRouteContext()
  const router = useRouter()
  const dropSchemaDialogRef =
    useRef<ComponentRef<typeof DropSchemaDialog>>(null)
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameSchemaDialogRef =
    useRef<ComponentRef<typeof RenameSchemaDialog>>(null)
  const renameTableDialogRef =
    useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const parentRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    scrollToActiveEvent()
  }, [])

  const revealEvent = useEffectEvent((id: string) =>
    scrollToIndex(
      rows.findIndex((row) => row.id === id),
      { align: 'auto' }
    )
  )

  useEffect(() => {
    if (highlightedId) {
      revealEvent(highlightedId)
    }
  }, [highlightedId])

  const deferredSearch = useDeferredValue(search)
  const isSearchSettled = deferredSearch === search

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
            onToggle={() => onToggleSchema(row.name)}
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
            variant="muted"
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
    <div
      ref={ref}
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
  )
}
