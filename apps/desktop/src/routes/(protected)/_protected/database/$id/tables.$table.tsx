import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { createFileRoute } from '@tanstack/react-router'
import { DataTable, useDatabase, useDatabaseColumns, useDatabaseRows } from '~/entities/database'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, table } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { data: databaseColumns } = useDatabaseColumns(database, table)
  const { data: databaseRows, error, isPending } = useDatabaseRows(database, table)

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
      <CardContent className="flex-1 h-full">
        <DataTable
          key={table}
          loading={isPending}
          data={databaseRows ?? []}
          columns={databaseColumns?.map(column => ({
            name: column.column_name,
            type: column.data_type,
          })) ?? []}
        />
      </CardContent>
    </Card>
  )
}
