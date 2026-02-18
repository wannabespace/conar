import type { ComponentRef } from 'react'
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
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
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

function TableItem({ schema, table, pinned = false, search, onRename, onDrop }: {
  schema: string
  table: string
  pinned?: boolean
  search?: string
  onRename: () => void
  onDrop: () => void
}) {
  const { connection } = Route.useRouteContext()

  return (
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
  )
}

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data: tablesAndSchemas, isPending } = useConnectionTablesAndSchemas({ connection, showSystem })
  const { schema: schemaParam } = useSearch({ from: '/_protected/database/$id/table/' })
  const tablesTreeOpenedSchemas = useStore(store, state => state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'])
  const pinnedTables = useStore(store, state => state.pinnedTables)
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(connection.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [connection, tablesAndSchemas])

  const filteredTablesAndSchemas = useMemo(() => {
    if (!tablesAndSchemas)
      return []

    const schemas = tablesAndSchemas.schemas
      .map(schema => ({
        ...schema,
        tables: schema.tables.filter(table =>
          !search
          || table.toLowerCase().includes(search.toLowerCase()),
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

      return {
        ...schema,
        pinnedTables: pinned,
        unpinnedTables: unpinned,
      }
    })
  }, [search, tablesAndSchemas, pinnedTables])

  const searchAccordionValue = useMemo(() => search
    ? filteredTablesAndSchemas.map(schema => schema.name)
    : tablesTreeOpenedSchemas, [search, filteredTablesAndSchemas, tablesTreeOpenedSchemas])

  return (
    <ScrollArea className={cn('h-full', className)}>
      <DropTableDialog ref={dropTableDialogRef} />
      <RenameTableDialog ref={renameTableDialogRef} />
      <ScrollViewport className="p-2">
        <Accordion
          value={searchAccordionValue}
          onValueChange={(v) => {
            if (!search) {
              store.setState(state => ({
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
                          <AccordionTrigger className={`
                            mb-1 cursor-pointer truncate px-2 py-1.5
                            hover:bg-accent/50 hover:no-underline
                          `}
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
