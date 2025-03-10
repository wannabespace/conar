import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { DataTable, useConnection, useDatabaseColumns, useDatabaseRows } from '~/entities/connection'

export const Route = createFileRoute(
  '/(protected)/_dashboard/database/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { id, table } = Route.useParams()
  const { data: connection } = useConnection(id)
  const { data: databaseColumns } = useDatabaseColumns(connection, table)
  const { data: databaseRows, error } = useDatabaseRows(connection, table)

  if (error) {
    return <div>{error.message}</div>
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {table}
        </CardTitle>
      </CardHeader>
      <CardContent ref={scrollRef} className="flex-1 overflow-auto">
        {databaseColumns && (
          <DataTable
            scrollRef={scrollRef}
            data={databaseRows ?? []}
            columns={databaseColumns.map(column => ({
              name: column.column_name,
              type: column.data_type,
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}
