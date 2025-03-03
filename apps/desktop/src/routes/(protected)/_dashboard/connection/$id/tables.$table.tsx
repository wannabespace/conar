import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@connnect/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { columnsInfoQuery, useConnection } from '~/entities/connection'

export const Route = createFileRoute(
  '/(protected)/_dashboard/connection/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, table } = Route.useParams()
  const { data: connection } = useConnection(id)
  const { data: tableData } = useQuery(columnsInfoQuery(connection!, table))

  return (
    <Card className="h-full">
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
              <TableHead>Column Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Max Length</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Nullable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData?.map(column => (
              <TableRow key={column.column_name}>
                <TableCell className="font-medium">{column.column_name}</TableCell>
                <TableCell>{column.data_type}</TableCell>
                <TableCell>{column.character_maximum_length || '-'}</TableCell>
                <TableCell>{column.column_default || '-'}</TableCell>
                <TableCell>{column.is_nullable === 'YES' ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
            {!tableData?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No columns found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
