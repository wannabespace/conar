import type { Connection } from '~/lib/indexeddb'
import { RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { databaseColumnsQuery, useDatabaseTables } from '~/entities/connection'
import { queryClient } from '~/main'

export function DatabaseTree({ connection, schema }: { connection: Connection, schema: string }) {
  const { data: tables } = useDatabaseTables(connection, schema)

  return (
    <div className="space-y-1">
      {tables?.map(table => (
        <Link
          key={table.table_name}
          to="/database/$id/tables/$table"
          params={{ id: connection.id, table: table.table_name }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted text-left"
          onMouseOver={() => queryClient.prefetchQuery(databaseColumnsQuery(connection, table.table_name))}
        >
          <RiTableLine className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{table.table_name}</span>
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
