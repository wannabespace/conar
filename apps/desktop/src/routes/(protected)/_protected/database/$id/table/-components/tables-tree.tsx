import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiMoreLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { Link, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import { useDatabaseTablesAndSchemas } from '~/entities/database'
import { addTab, databaseStore } from '../../../-store'
import { DropTableDialog } from './drop-table-dialog'
import { RenameTableDialog } from './rename-table-dialog'

function Skeleton() {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: 10 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="flex items-center gap-2 h-5 px-2">
          <div className="h-full w-5 shrink-0 rounded-md bg-muted animate-pulse" />
          <div
            className="h-full rounded-md bg-muted animate-pulse"
            // React Compiler handles it
            // eslint-disable-next-line react-hooks/purity
            style={{ width: `${Math.random() * 40 + 60 - 30}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function TablesTree({ database, className, search }: { database: typeof databases.$inferSelect, className?: string, search?: string }) {
  const { data: tablesAndSchemas, isPending } = useDatabaseTablesAndSchemas({ database })
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const store = databaseStore(database.id)
  const tablesTreeOpenedSchemas = useStore(store, state => state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'])
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)

  const filteredTablesAndSchemas = useMemo(() => tablesAndSchemas?.schemas?.map(schema => ({
    ...schema,
    tables: schema.tables.filter(table =>
      !search || table.toLowerCase().includes(search.toLowerCase()),
    ).toSorted((a, b) => a.localeCompare(b)),
  })).filter(schema => schema.tables.length) || [], [search, tablesAndSchemas])

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
              <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                <Skeleton />
              </div>
            )
          : filteredTablesAndSchemas.length === 0
            ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center h-full">
                  <RiTableLine className="h-10 w-10 text-muted-foreground mb-2" />
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
                        <AccordionTrigger className="truncate mb-1 py-1.5 px-2 cursor-pointer hover:no-underline hover:bg-accent/50">
                          <span className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <RiStackLine
                                    className={cn(
                                      'size-4 text-muted-foreground shrink-0 opacity-50',
                                      schemaParam === schema.name && 'text-primary opacity-100',
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
                          <AnimatePresence>
                            {schema.tables.map(table => (
                              <motion.div
                                key={table}
                                initial={search ? { opacity: 0, height: 0 } : false}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Link
                                  to="/database/$id/table"
                                  params={{ id: database.id }}
                                  search={{
                                    schema: schema.name,
                                    table,
                                  }}
                                  preloadDelay={200}
                                  onDoubleClick={() => addTab(database.id, schema.name, table)}
                                  className={cn(
                                    'group w-full flex items-center gap-2 border border-transparent py-1 px-2 text-sm text-foreground rounded-md hover:bg-accent/30',
                                    tableParam === table && 'bg-primary/10 hover:bg-primary/20 border-primary/20',
                                  )}
                                >
                                  <RiTableLine
                                    className={cn(
                                      'size-4 text-muted-foreground shrink-0 opacity-50',
                                      tableParam === table && 'text-primary opacity-100',
                                    )}
                                  />
                                  <span className="truncate">
                                    {search
                                      ? (
                                          <span
                                            // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
                                            dangerouslySetInnerHTML={{
                                              __html: table.replace(
                                                new RegExp(search, 'gi'),
                                                match => `<mark class="text-white bg-primary/50">${match}</mark>`,
                                              ),
                                            }}
                                          />
                                        )
                                      : table}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className={cn(
                                          'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 ml-auto transition-opacity',
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
                                          renameTableDialogRef.current?.rename(schema.name, table)
                                        }}
                                      >
                                        <RiEditLine className="size-4" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          dropTableDialogRef.current?.drop(schema.name, table)
                                        }}
                                      >
                                        <RiDeleteBin7Line className="size-4" />
                                        Drop
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </Link>
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
