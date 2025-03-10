import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { DataTable, useDatabase, useDatabaseColumns, useDatabaseRows } from '~/entities/database'

export const Route = createFileRoute(
  '/(protected)/_dashboard/database/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { id, table } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { data: databaseColumns } = useDatabaseColumns(database, table)
  const { data: databaseRows, error } = useDatabaseRows(database, table)

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
