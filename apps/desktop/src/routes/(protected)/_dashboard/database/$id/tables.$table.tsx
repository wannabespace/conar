import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { DataTable, useConnection, useDatabaseColumns, useDatabaseRows } from '~/entities/connection'

export const Route = createFileRoute(
  '/(protected)/_dashboard/database/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, table } = Route.useParams()
  const { data: connection } = useConnection(id)
  const { data: databaseColumns } = useDatabaseColumns(connection, table)
  const { data: databaseRows, error } = useDatabaseRows(connection, table)
  const parentRef = useRef<HTMLDivElement>(null)

  if (error) {
    return <div>{error.message}</div>
  }

  return (
    <Card className="h-full overflow-auto">
      <ScrollArea scrollRef={parentRef} className="h-full">
        <CardHeader>
          <CardTitle>
            {table}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            scrollRef={parentRef}
            data={databaseRows ?? []}
            columns={databaseColumns?.map(column => ({
              name: column.column_name,
              type: column.data_type,
            })) ?? []}
          />
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
