import type { Database } from '~/lib/indexeddb'
import { cn } from '@connnect/ui/lib/utils'
import { useDebouncedCallback } from '@react-hookz/web'
import { RiTableLine } from '@remixicon/react'
import { Link, useParams } from '@tanstack/react-router'
import { databaseColumnsQuery, useDatabaseTables } from '~/entities/database'
import { queryClient } from '~/main'

export function DatabaseTree({ database, schema }: { database: Database, schema: string }) {
  const { data: tables } = useDatabaseTables(database, schema)
  const { table: tableParam } = useParams({ strict: false })

  const debouncedPrefetchColumns = useDebouncedCallback(
    (tableName: string) => queryClient.prefetchQuery(databaseColumnsQuery(database, tableName)),
    [database.id, schema],
    150,
  )

  return (
    <div>
      {tables?.map(table => (
        <Link
          key={table.name}
          to="/database/$id/tables/$table"
          params={{ id: database.id, table: table.name }}
          className={cn(
            'w-full flex items-center gap-2 py-1.5 text-sm text-foreground text-left',
            tableParam === table.name && 'font-medium',
          )}
          onMouseOver={() => debouncedPrefetchColumns(table.name)}
        >
          <RiTableLine className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{table.name}</span>
        </Link>
      ))}
      {!tables?.length && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <RiTableLine className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No tables found</p>
        </div>
      )}
    </div>
  )
}
