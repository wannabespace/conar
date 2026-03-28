import type { ComponentRef, RefObject } from 'react'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiEyeLine, RiFileCopyLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { SidebarLink } from '~/components/sidebar-link'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { addTab, cleanupPinnedTables, getConnectionResourceStore, togglePinTable } from '~/entities/connection/store'
import { Route } from '..'
import { DropTableDialog } from './drop-table-dialog'
import { RenameTableDialog } from './rename-table-dialog'

const skeletonWidths = Array.from({ length: 10 }).map(() => `${Math.random() * 40 + 30}%`)

function Skeleton() {
  return (
    <div className="w-full space-y-3">
      {skeletonWidths.map(width => (
        <div key={width} className="flex h-5 items-center gap-2 px-2">
          <div className="h-full w-5 shrink-0 animate-pulse rounded-md bg-muted" />
          <div
            className="h-full animate-pulse rounded-md bg-muted"
            style={{ width }}
          />
        </div>
      ))}
    </div>
  )
}

function TableItem({ schema, table, isView = false, pinned = false, search, onRename, onDrop }: {
  schema: string
  table: string
  isView?: boolean
  pinned?: boolean
  search?: string
  onRename: () => void
  onDrop: () => void
}) {
  const { connectionResource } = Route.useRouteContext()
  const Icon = isView ? RiEyeLine : RiTableLine

  return (
    <SidebarLink
      to="/connection/$resourceId/table"
      params={{ resourceId: connectionResource.id }}
      search={{ schema, table }}
      preloadDelay={200}
      onDoubleClick={() => addTab(connectionResource.id, schema, table)}
      className="group"
    >
      {({ isActive }) => (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Icon
                className={cn(
                  'size-4 shrink-0 text-muted-foreground opacity-50',
                  isActive && 'text-primary opacity-100',
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="left">
              {isView ? 'View' : 'Table'}
            </TooltipContent>
          </Tooltip>
          <span className="truncate">
            <HighlightText text={table} match={search} />
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              `
                -mr-1 ml-auto opacity-0 transition-opacity
                group-hover:opacity-100
                focus-visible:opacity-100
              `,
              isActive && 'hover:bg-primary/10',
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              togglePinTable(connectionResource.id, schema, table)
            }}
          >
            {pinned
              ? <RiPushpinFill className="size-3 text-primary" />
              : <RiPushpinLine className="size-3" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              render={(
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    `
                      opacity-0 transition-opacity
                      group-hover:opacity-100
                      focus-visible:opacity-100
                    `,
                    isActive && 'hover:bg-primary/10',
                  )}
                />
              )}
            >
              <RiMoreLine className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-48"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(table, 'Table name copied')
                }}
              >
                <RiFileCopyLine className="size-4" />
                Copy Name
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isView}
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                }}
              >
                <RiEditLine className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isView}
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDrop()
                }}
              >
                <RiDeleteBin7Line className="size-4" />
                Drop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </SidebarLink>
  )
}

interface VirtualItemData {
  type: 'pinned' | 'unpinned' | 'separator'
  table?: string
  schema: string
}

function VirtualizedTableList({
  items,
  parentRef,
  onRename,
  onDrop,
  search,
}: {
  items: VirtualItemData[]
  parentRef: RefObject<HTMLDivElement | null>
  onRename: (schema: string, table: string) => void
  onDrop: (schema: string, table: string) => void
  search?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    getItemKey: index => items[index]!.type === 'separator'
      ? `separator-${index}`
      : `${items[index]!.type}-${items[index]!.schema}-${items[index]!.table}`,
    estimateSize: index => items[index]!.type === 'separator' ? 17 : 28,
    overscan: 1,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={listRef}
      className="relative w-full"
      style={{ height: `${totalSize}px` }}
    >
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index]
        if (!item)
          return null

        const rowKey = item.type === 'separator'
          ? `separator-${virtualRow.index}`
          : `${item.type}-${item.schema}-${item.table}`

        return (
          <div
            key={rowKey}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {item.type === 'separator'
              ? (
                  <div className="py-2">
                    <Separator className="h-px w-full" />
                  </div>
                )
              : (
                  <TableItem
                    schema={item.schema}
                    table={item.table!}
                    pinned={item.type === 'pinned'}
                    search={search}
                    onRename={() => item.table && onRename(item.schema, item.table)}
                    onDrop={() => item.table && onDrop(item.schema, item.table)}
                  />
                )}
          </div>
        )
      })}
    </div>
  )
}

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data: tablesAndSchemas, isPending } = useQuery(resourceTablesAndSchemasQueryOptions({ silent: false, connectionResource, showSystem }))
  const { schema: schemaParam } = useSearch({ from: '/_protected/connection/$resourceId/table/' })
  const tablesTreeOpenedSchemas = useSubscription(store, { selector: state => state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'] })
  const pinnedTables = useSubscription(store, { selector: state => state.pinnedTables })
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(connectionResource.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table: table.name }))))
  }, [connectionResource, tablesAndSchemas])

  const filteredTablesAndSchemas = useMemo(() => {
    if (!tablesAndSchemas)
      return []

    const schemas = tablesAndSchemas.schemas
      .map(schema => ({
        ...schema,
        tables: schema.tables.filter(table =>
          !search
          || table.name.toLowerCase().includes(search.toLowerCase()),
        ).toSorted((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(schema => schema.tables.length)

    const pinnedSet = new Set(pinnedTables.map(t => `${t.schema}:${t.table}`))

    return schemas.map((schema) => {
      const pinned: { name: string, isView: boolean }[] = []
      const unpinned: { name: string, isView: boolean }[] = []

      schema.tables.forEach((table) => {
        const isPinned = pinnedSet.has(`${schema.name}:${table.name}`)
        if (isPinned) {
          pinned.push(table)
        }
        else {
          unpinned.push(table)
        }
      })
      const virtualItems: VirtualItemData[] = []

      pinned.forEach(table => virtualItems.push({
        type: 'pinned',
        table: table.name,
        schema: schema.name,
      }))

      if (pinned.length > 0 && unpinned.length > 0) {
        virtualItems.push({ type: 'separator', schema: schema.name })
      }

      unpinned.forEach(table => virtualItems.push({
        type: 'unpinned',
        table: table.name,
        schema: schema.name,
      }))

      return {
        ...schema,
        pinnedTables: pinned,
        unpinnedTables: unpinned,
        virtualItems,
      }
    })
  }, [search, tablesAndSchemas, pinnedTables])

  const searchAccordionValue = useMemo(() => search
    ? filteredTablesAndSchemas.map(schema => schema.name)
    : tablesTreeOpenedSchemas, [search, filteredTablesAndSchemas, tablesTreeOpenedSchemas])

  return (
    <ScrollArea scrollRef={scrollRef} className={cn('h-full min-h-0', className)} scrollFade>
      <DropTableDialog ref={dropTableDialogRef} />
      <RenameTableDialog ref={renameTableDialogRef} />
      <Accordion
        value={searchAccordionValue}
        onValueChange={(v) => {
          if (!search) {
            store.set(state => ({
              ...state,
              tablesTreeOpenedSchemas: v,
            } satisfies typeof state))
          }
        }}
        data-mask
        type="multiple"
        className="w-full space-y-2"
      >
        {isPending
          ? (
              <div className={`
                flex h-full flex-1 flex-col items-center justify-center
                text-center
              `}
              >
                <Skeleton />
              </div>
            )
          : filteredTablesAndSchemas.length === 0
            ? (
                <div className={`
                  flex h-full flex-1 flex-col items-center justify-center py-8
                  text-center
                `}
                >
                  <RiTableLine className="mb-2 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No tables found</p>
                </div>
              )
            : (
                <AnimatePresence>
                  {filteredTablesAndSchemas.map(schema => (
                    <motion.div
                      key={schema.name}
                      initial={search ? { opacity: 0, height: 0 } : false}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AccordionItem
                        value={schema.name}
                        className="border-b-0"
                      >
                        {connection.type !== ConnectionType.ClickHouse && (
                          <AccordionTrigger
                            data-schema-trigger={schema.name}
                            className={`
                              mb-1 cursor-pointer truncate px-2 py-1.5
                              hover:bg-accent/50 hover:no-underline
                              data-[state=open]:sticky data-[state=open]:top-2
                              data-[state=open]:z-10
                              data-[state=open]:bg-background
                            `}
                          >
                            <span className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <RiStackLine
                                    className={cn(
                                      `
                                        size-4 shrink-0 text-muted-foreground
                                        opacity-50
                                      `,
                                      schemaParam === schema.name && `
                                        text-primary opacity-100
                                      `,
                                    )}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Schema
                                </TooltipContent>
                              </Tooltip>
                              {schema.name}
                            </span>
                          </AccordionTrigger>
                        )}
                        <AccordionContent className="pb-0">
                          <VirtualizedTableList
                            items={schema.virtualItems}
                            parentRef={scrollRef}
                            search={search}
                            onRename={(schema, table) => renameTableDialogRef.current?.rename(schema, table)}
                            onDrop={(schema, table) => dropTableDialogRef.current?.drop(schema, table)}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
      </Accordion>
    </ScrollArea>
  )
}
