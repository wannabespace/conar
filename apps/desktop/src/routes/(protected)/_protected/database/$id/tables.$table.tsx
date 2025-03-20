import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Separator } from '@connnect/ui/components/separator'
import { createFileRoute } from '@tanstack/react-router'
import { DataTable, DataTableFooter, useDatabase, useDatabaseColumns, useDatabaseRows } from '~/entities/database'

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
      <CardContent className="flex-1 overflow-hidden pb-0">
        <DataTable
          key={table}
          loading={isPending}
          data={databaseRows ?? []}
          columns={databaseColumns.map(column => ({
            name: column.column_name,
            type: column.data_type,
          }))}
          className="h-full"
        />
      </CardContent>
      <CardFooter className="flex flex-col">
        <Separator className="mb-4" />
        <DataTableFooter currentPage={1} totalPages={10} />
      </CardFooter>
    </Card>
  )
}
