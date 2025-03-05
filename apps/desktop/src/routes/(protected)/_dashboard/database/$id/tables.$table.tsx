import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@connnect/ui/components/table'
import { createFileRoute } from '@tanstack/react-router'
import { PAGE_SCREEN_CLASS } from '~/constants'
import { useConnection, useDatabaseColumns, useDatabaseRows } from '~/entities/connection'

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

  if (error) {
    return <div>{error.message}</div>
  }

  return (
    <Card className="h-full">
      <ScrollArea className={PAGE_SCREEN_CLASS}>
        <CardHeader>
          <CardTitle>
            Table:
            {' '}
            {table}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                {databaseColumns?.map(column => (
                  <TableHead key={column.column_name}>{column.column_name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {databaseRows?.map((row, index) => (
                <TableRow key={index}>
                  {databaseColumns?.map(column => (
                    <TableCell key={`${index}-${column.column_name}`}>
                      {JSON.stringify(row[column.column_name])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!databaseColumns?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No columns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
