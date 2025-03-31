import type { Database } from '~/lib/indexeddb'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import { useDebouncedCallback } from '@react-hookz/web'
import { RiTableLine } from '@remixicon/react'
import { Link, useParams } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { databaseColumnsQuery, databaseRowsQuery, useDatabaseTables } from '~/entities/database'
import { queryClient } from '~/main'

export function TablesTree({ database, schema, className, search }: { database: Database, schema: string, className?: string, search?: string }) {
  const { data: tables } = useDatabaseTables(database, schema)
  const { table: tableParam } = useParams({ strict: false })
  const ref = useRef<HTMLDivElement>(null)

  const debouncedPrefetchColumns = useDebouncedCallback(
    (tableName: string) => queryClient.ensureQueryData(databaseColumnsQuery(database, tableName, schema)),
    [database.id, schema],
    20,
  )

  const debouncedPrefetchRows = useDebouncedCallback(
    (tableName: string) => queryClient.ensureQueryData(databaseRowsQuery(database, tableName, schema)),
    [database.id, schema],
    100,
  )

  const filteredTables = tables?.filter(table =>
    !search || table.name.toLowerCase().includes(search.toLowerCase()),
  ) || []

  const virtualizer = useVirtualizer({
    count: filteredTables.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 35,
    scrollMargin: ref.current?.offsetTop ?? 0,
    overscan: 2,
  })

  return (
    <ScrollArea scrollRef={ref} className={cn('overflow-y-auto', className)}>
      <div className="size-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <div className="relative flex flex-col">
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const table = filteredTables?.[virtualRow.index]

            if (!table)
              return null

            return (
              <Link
                key={virtualRow.key}
                data-mask
                to="/database/$id/tables/$schema/$table"
                params={{
                  id: database.id,
                  schema,
                  table: table.name,
                }}
                className={cn(
                  'absolute top-0 left-0 w-full border-l-2 border-transparent flex items-center gap-2 py-1.5 px-4 text-sm text-foreground hover:bg-accent/50',
                  tableParam === table.name && 'border-primary bg-accent/50 font-medium',
                )}
                onMouseOver={() => {
                  debouncedPrefetchColumns(table.name)
                  debouncedPrefetchRows(table.name)
                }}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <RiTableLine className="size-4 text-muted-foreground shrink-0" />
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
