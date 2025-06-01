import type { Database } from '~/lib/indexeddb'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { useDebouncedCallback } from '@connnect/ui/hookas/use-debounced-callback'
import { clickHandlers, cn } from '@connnect/ui/lib/utils'
import { RiTableLine } from '@remixicon/react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'
import { databaseRowsQuery, ensureDatabaseTableCore, useDatabaseTables } from '~/entities/database'
import { queryClient } from '~/main'
import { getTableStoreState } from '../tables.$schema/$table'

export function TablesTree({ database, schema, className, search }: { database: Database, schema: string, className?: string, search?: string }) {
  const { data: tables } = useDatabaseTables(database, schema)
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
    (tableName: string) => {
      queryClient.ensureInfiniteQueryData(databaseRowsQuery(database, tableName, schema, getQueryOpts(tableName)))
    },
    [database.id, schema],
    100,
  )

  const filteredTables = useMemo(() => tables?.filter(table =>
    !search || table.name.toLowerCase().includes(search.toLowerCase()),
  ) || [], [search, tables])

  const virtualizer = useVirtualizer({
    count: filteredTables.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 32,
    overscan: 2,
  })

  return (
    <ScrollArea ref={ref} className={cn('h-full overflow-y-auto px-2', className)}>
      <div className="size-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <div className="relative flex flex-col">
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const table = filteredTables[virtualRow.index]

            return (
              <Link
                data-mask
                key={virtualRow.key}
                to="/database/$id/tables/$schema/$table"
                params={{
                  id: database.id,
                  schema,
                  table: table.name,
                }}
                {...clickHandlers(() => navigate({
                  to: '/database/$id/tables/$schema/$table',
                  params: {
                    id: database.id,
                    schema,
                    table: table.name,
                  },
                }))}
                className={cn(
                  'absolute top-0 left-0',
                  'w-full flex items-center gap-2 py-1.5 px-2 text-sm text-foreground rounded-md hover:bg-accent/60',
                  tableParam === table.name && 'bg-accent hover:bg-accent',
                )}
                onMouseOver={() => {
                  ensureDatabaseTableCore(database, schema, table.name, getQueryOpts(table.name))
                  debouncedPrefetchRows(table.name)
                }}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <RiTableLine
                  className={cn(
                    'size-4 text-muted-foreground shrink-0',
                    tableParam === table.name && 'text-primary',
                  )}
                />
                <span className="truncate">{table.name}</span>
              </Link>
            )
          })}
        </div>
        {!tables?.length && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <RiTableLine className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No tables found</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
