import type { ComponentProps, ComponentRef, RefObject } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { MotionSeparator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SidebarLink } from '~/components/sidebar-link'
import { useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { addTab, cleanupPinnedTables, connectionStore, togglePinTable } from '~/entities/connection/store'
import { Route } from '..'
import { DropTableDialog } from './drop-table-dialog'
import { RenameTableDialog } from './rename-table-dialog'

const treeVariants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0 },
}

const treeTransition = {
  layout: { duration: 0.15, ease: 'easeInOut' as const },
  opacity: { duration: 0.1 },
  height: { duration: 0.1 },
}

const skeletonWidths = Array.from({ length: 10 }, () => `${Math.random() * 40 + 30}%`)

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

const TableItem = memo(({ schema, table, pinned = false, search, onRename, onDrop }: {
  schema: string
  table: string
  pinned?: boolean
  search?: string
  onRename: VoidFunction
  onDrop: VoidFunction
}) => {
  const { connection } = Route.useRouteContext()

  return (
    <div>
      <SidebarLink
        to="/database/$id/table"
        params={{ id: connection.id }}
        search={{ schema, table }}
        preloadDelay={200}
        onDoubleClick={() => addTab(connection.id, schema, table)}
        className="group"
      >
        {({ isActive }) => (
          <>
            <RiTableLine
              className={cn(
                'size-4 shrink-0 text-muted-foreground opacity-50',
                isActive && 'text-primary opacity-100',
              )}
            />
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
                  onClick={e => e.stopPropagation()}
                >
                  <RiMoreLine className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-48"
                onCloseAutoFocus={e => e.preventDefault()}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onRename()
                  }}
                >
                  <RiEditLine className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
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
    </div>
  )
})

TableItem.displayName = 'TableItem'

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
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const scrollEl = parentRef.current
    const listEl = listRef.current
    if (!scrollEl || !listEl)
      return

    const measure = () => {
      const scrollRect = scrollEl.getBoundingClientRect()
      const listRect = listEl.getBoundingClientRect()
      setScrollMargin(listRect.top - scrollRect.top + scrollEl.scrollTop)
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(scrollEl)
    return () => resizeObserver.disconnect()
  }, [parentRef])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => {
      const item = items[index]
      if (!item)
        return index
      if (item.type === 'separator')
        return `separator-${index}`
      return `${item.type}-${item.schema}-${item.table}`
    },
    estimateSize: (index) => {
      const item = items[index]
      if (item?.type === 'separator')
        return 17
      return 28
    },
    overscan: 5,
    scrollMargin,
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
            style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
          >
            {item.type === 'separator'
              ? (
                  <div className="py-2">
                    <MotionSeparator className="h-px w-full" />
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

export function TablesTree({ className, search: rawSearch }: Pick<ComponentProps<typeof ScrollArea>, 'className'> & { search?: string }) {
  const search = useDeferredValue(rawSearch)
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const { showSystem, tablesTreeOpenedSchemas, pinnedTables } = useStore(store, ({ showSystem, tablesTreeOpenedSchemas, pinnedTables }) => ({
    showSystem,
    tablesTreeOpenedSchemas,
    pinnedTables,
  }))
  const { data: tablesAndSchemas, isPending } = useConnectionTablesAndSchemas({ connection, showSystem })
  const openedSchemasForTablesTree = useMemo(
    () => tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'],
    [tablesAndSchemas, tablesTreeOpenedSchemas],
  )
  const { schema: schemaParam } = useSearch({ from: '/_protected/database/$id/table/' })
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(connection.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [connection, tablesAndSchemas])

  const filteredTablesAndSchemas = useMemo(() => {
    if (!tablesAndSchemas)
      return []

    const lowerSearch = search?.trim().toLowerCase()

    const schemas = tablesAndSchemas.schemas
      .map(schema => ({
        ...schema,
        tables: schema.tables.filter(table =>
          !lowerSearch
          || table.toLowerCase().includes(lowerSearch),
        ).toSorted((a, b) => a.localeCompare(b)),
      }))
      .filter(schema => schema.tables.length)

    const pinnedSet = new Set(pinnedTables.map(t => `${t.schema}:${t.table}`))

    return schemas.map((schema) => {
      const pinned: string[] = []
      const unpinned: string[] = []

      schema.tables.forEach((table) => {
        const isPinned = pinnedSet.has(`${schema.name}:${table}`)
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
        table,
        schema: schema.name,
      }))

      if (pinned.length > 0 && unpinned.length > 0) {
        virtualItems.push({ type: 'separator', schema: schema.name })
      }

      unpinned.forEach(table => virtualItems.push({
        type: 'unpinned',
        table,
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
    : openedSchemasForTablesTree, [search, filteredTablesAndSchemas, openedSchemasForTablesTree])

  return (
    <ScrollArea className={cn('h-full', className)}>
      <DropTableDialog ref={dropTableDialogRef} />
      <RenameTableDialog ref={renameTableDialogRef} />
      <ScrollViewport ref={scrollRef} className="p-2">
        <Accordion
          value={searchAccordionValue}
          onValueChange={(tablesTreeOpenedSchemas) => {
            if (!search) {
              store.setState(state => ({
                ...state,
                tablesTreeOpenedSchemas,
              } satisfies typeof state))
            }
          }}
          data-mask
          type="multiple"
          className="w-full space-y-2"
        >
          {isPending
            ? (
                <div className="
                  flex h-full flex-1 flex-col items-center justify-center
                  text-center
                "
                >
                  <Skeleton />
                </div>
              )
            : filteredTablesAndSchemas.length === 0
              ? (
                  <div className="
                    flex h-full flex-1 flex-col items-center justify-center py-8
                    text-center
                  "
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
                          <AccordionTrigger className="
                            mb-1 cursor-pointer truncate px-2 py-1.5
                            hover:bg-accent/50 hover:no-underline
                          "
                          >
                            <span className="flex items-center gap-2">
                              <TooltipProvider>
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
                              </TooltipProvider>
                              {schema.name}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0">
                            {schema.virtualItems.length > 50
                              ? (
                                  <VirtualizedTableList
                                    items={schema.virtualItems}
                                    parentRef={scrollRef}
                                    search={search}
                                    onRename={(s, t) => renameTableDialogRef.current?.rename(s, t)}
                                    onDrop={(s, t) => dropTableDialogRef.current?.drop(s, t)}
                                  />
                                )
                              : (
                                  <AnimatePresence mode="popLayout">
                                    {schema.pinnedTables.map(table => (
                                      <motion.div
                                        key={`${schema.name}:${table}`}
                                        layout
                                        variants={treeVariants}
                                        initial={search ? treeVariants.hidden : false}
                                        animate="visible"
                                        exit="hidden"
                                        transition={treeTransition}
                                      >
                                        <TableItem
                                          schema={schema.name}
                                          table={table}
                                          pinned
                                          search={search}
                                          onRename={() => renameTableDialogRef.current?.rename(schema.name, table)}
                                          onDrop={() => dropTableDialogRef.current?.drop(schema.name, table)}
                                        />
                                      </motion.div>
                                    ))}
                                    {schema.pinnedTables.length > 0 && schema.unpinnedTables.length > 0 && (
                                      <MotionSeparator
                                        className="my-2 h-px!"
                                        layout
                                        variants={treeVariants}
                                        initial={search ? treeVariants.hidden : false}
                                        animate="visible"
                                        exit="hidden"
                                        transition={treeTransition}
                                      />
                                    )}
                                    {schema.unpinnedTables.map(table => (
                                      <motion.div
                                        key={`${schema.name}:${table}`}
                                        layout
                                        variants={treeVariants}
                                        initial={search ? treeVariants.hidden : false}
                                        animate="visible"
                                        exit="hidden"
                                        transition={treeTransition}
                                      >
                                        <TableItem
                                          schema={schema.name}
                                          table={table}
                                          search={search}
                                          onRename={() => renameTableDialogRef.current?.rename(schema.name, table)}
                                          onDrop={() => dropTableDialogRef.current?.drop(schema.name, table)}
                                        />
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                )}
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
        </Accordion>
      </ScrollViewport>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}
