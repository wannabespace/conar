import type { Database } from '~/lib/indexeddb'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useDebouncedCallback } from '@conar/ui/hookas/use-debounced-callback'
import { useSessionStorage } from '@conar/ui/hookas/use-session-storage'
import { clickHandlers, cn } from '@conar/ui/lib/utils'
import { RiStackLine, RiTableLine } from '@remixicon/react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import { prefetchDatabaseTableCore, useDatabaseTablesAndSchemas } from '~/entities/database'
import { getTableStoreState } from '../tables.$schema/$table'

export function TablesTree({ database, className, search }: { database: Database, className?: string, search?: string }) {
  const { data: tablesAndSchemas, isPending } = useDatabaseTablesAndSchemas(database)
  const { schema: schemaParam, table: tableParam } = useParams({ strict: false })
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getTableStoreState(schemaParam, tableName) : null

    if (state) {
      return {
        filters: state.filters,
        orderBy: state.orderBy,
      }
    }

    return {
      filters: [],
      orderBy: {},
    }
  }

  const debouncedPrefetchDatabaseTableCore = useDebouncedCallback(
    (schema: string, tableName: string) => prefetchDatabaseTableCore(database, schema, tableName, getQueryOpts(tableName)),
    [database.id],
    100,
  )

  const filteredTablesAndSchemas = useMemo(() => tablesAndSchemas?.schemas?.map(schema => ({
    ...schema,
    tables: schema.tables.filter(table =>
      !search || table.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter(schema => schema.tables.length) || [], [search, tablesAndSchemas])

  const [accordionValue, setAccordionValue] = useSessionStorage<string[]>(`database-tables-accordion-value-${database.id}`, () => schemaParam ? [schemaParam] : ['public'])

  const searchAccordionValue = useMemo(() => search ? filteredTablesAndSchemas.map(schema => schema.name) : accordionValue, [search, filteredTablesAndSchemas, accordionValue])

  return (
    <ScrollArea ref={ref} className={cn('h-full overflow-y-auto p-2', className)}>
      <Accordion
        value={searchAccordionValue}
        onValueChange={(v) => {
          if (!search) {
            setAccordionValue(v)
          }
        }}
        data-mask
        type="multiple"
        className="w-full"
      >
        {isPending
          ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                <div className="space-y-2 w-full">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 h-6">
                      <div className="h-full w-6 shrink-0 rounded-md bg-muted animate-pulse" />
                      <div className="h-full w-full rounded-md bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
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
                        <AccordionContent className="pb-4">
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
                                  to="/database/$id/tables/$schema/$table"
                                  params={{
                                    id: database.id,
                                    schema: schema.name,
                                    table,
                                  }}
                                  {...clickHandlers(() => navigate({
                                    to: '/database/$id/tables/$schema/$table',
                                    params: {
                                      id: database.id,
                                      schema: schema.name,
                                      table,
                                    },
                                  }))}
                                  className={cn(
                                    'w-full flex items-center gap-2 border border-transparent py-1.5 px-2 text-sm text-foreground rounded-md hover:bg-accent/60',
                                    tableParam === table && 'bg-primary/10 hover:bg-primary/20 border-primary/20',
                                  )}
                                  onMouseOver={() => debouncedPrefetchDatabaseTableCore(schema.name, table)}
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
