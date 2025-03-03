import type { Connection } from '~/lib/indexeddb'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { useConnectionInfo } from '~/entities/connection'
import { useOpenTabs } from '../-composables'

export function ConnectionTree({ connection }: { connection: Connection }) {
  const { data: info } = useConnectionInfo(connection)
  const { openTabs, setOpenTabs } = useOpenTabs(connection.id)

  function handleTableClick(table: string) {
    if (openTabs.some(tab => tab.id === table))
      return

    setOpenTabs([...(openTabs ?? []), { id: table, label: table }])
  }

  if (!connection)
    return null

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {info?.map(table => (
            <Link
              to="/connection/$id/tables/$table"
              params={{ id: connection.id, table: table.table_name }}
              key={table.table_name}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted text-left"
              onClick={() => handleTableClick(table.table_name)}
            >
              <RiTableLine className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{table.table_name}</span>
            </Link>
          ))}
          {!info?.length && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RiTableLine className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tables found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
