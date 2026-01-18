import type { ComponentRef } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { Link, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useDatabaseTablesAndSchemas } from '~/entities/database/queries'
import { addTab, cleanupPinnedTables, databaseStore, togglePinTable } from '~/entities/database/store'
import { Route } from '..'
import { DropTableDialog } from './drop-table-dialog'
import { RenameTableDialog } from './rename-table-dialog'

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

function Skeleton() {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="flex h-5 items-center gap-2 px-2">
          <div className="h-full w-5 shrink-0 animate-pulse rounded-md bg-muted" />
          <div
            className="h-full animate-pulse rounded-md bg-muted"
            style={{ width: `${Math.random() * 40 + 60 - 30}%` }}
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
  const { table: tableParam, schema: schemaParam } = Route.useSearch()
  const { database } = Route.useRouteContext()

  return (
    <Link
      to="/database/$id/table"
      params={{ id: database.id }}
      search={{
        schema,
        table,
      }}
      preloadDelay={200}
      onDoubleClick={() => addTab(database.id, schema, table)}
      className={cn(
        `
          group flex w-full items-center gap-2 rounded-md border
          border-transparent px-2 py-1 text-sm text-foreground
          hover:bg-accent/30
        `,
        tableParam === table && schemaParam === schema && `
          border-primary/20 bg-primary/10
          hover:bg-primary/20
        `,
      )}
    >
      <RiTableLine
        className={cn(
          'size-4 shrink-0 text-muted-foreground opacity-50',
          tableParam === table && 'text-primary opacity-100',
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
          tableParam === table && 'hover:bg-primary/10',
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          togglePinTable(database.id, schema, table)
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
              tableParam === table && 'hover:bg-primary/10',
            )}
            onClick={e => e.stopPropagation()}
          >
            <RiMoreLine className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
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
    </Link>
  )
}

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { database } = Route.useRouteContext()
  const { data: tablesAndSchemas, isPending } = useDatabaseTablesAndSchemas({ database })
  const { schema: schemaParam } = useSearch({ from: '/_protected/database/$id/table/' })
  const store = databaseStore(database.id)
  const tablesTreeOpenedSchemas = useStore(store, state => state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'])
  const pinnedTables = useStore(store, state => state.pinnedTables)
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(database.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [database, tablesAndSchemas])

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
    <ScrollArea className={cn('h-full overflow-y-auto p-2', className)}>
      <DropTableDialog
        ref={dropTableDialogRef}
        database={database}
      />
      <RenameTableDialog
        ref={renameTableDialogRef}
        database={database}
      />
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
    </ScrollArea>
  )
}
