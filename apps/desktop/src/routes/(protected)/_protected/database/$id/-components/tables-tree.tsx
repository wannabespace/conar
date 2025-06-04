import type { Database } from '~/lib/indexeddb'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@connnect/ui/components/accordion'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useDebouncedCallback } from '@connnect/ui/hookas/use-debounced-callback'
import { useSessionStorage } from '@connnect/ui/hookas/use-session-storage'
import { clickHandlers, cn } from '@connnect/ui/lib/utils'
import { RiStackLine, RiTableLine } from '@remixicon/react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import { databaseRowsQuery, ensureDatabaseTableCore, useDatabaseTablesAndSchemas } from '~/entities/database'
import { queryClient } from '~/main'
import { getTableStoreState } from '../tables.$schema/$table'

export function TablesTree({ database, className, search }: { database: Database, className?: string, search?: string }) {
  const { data: tablesAndSchemas } = useDatabaseTablesAndSchemas(database)
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

  const debouncedPrefetchRows = useDebouncedCallback(
    (schema: string, tableName: string) => {
      queryClient.ensureInfiniteQueryData(databaseRowsQuery(database, tableName, schema, getQueryOpts(tableName)))
    },
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
                            'w-full flex items-center gap-2 py-1.5 px-2 text-sm text-foreground rounded-md hover:bg-accent/50',
                            tableParam === table && 'bg-accent/80 hover:bg-accent/80',
                          )}
                          onMouseOver={() => {
                            ensureDatabaseTableCore(database, schema.name, table, getQueryOpts(table))
                            debouncedPrefetchRows(schema.name, table)
                          }}
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
      </Accordion>
      {!filteredTablesAndSchemas.length && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center h-full">
          <RiTableLine className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No tables found</p>
        </div>
      )}
    </ScrollArea>
  )
}
