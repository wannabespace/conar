import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@connnect/ui/components/table'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

interface DatabaseTableProps<T extends Record<string, unknown>> {
  rows: T[]
  columns: {
    name: string
    type?: string
  }[]
}

export function DatabaseTable<T extends Record<string, unknown>>({ rows, columns }: DatabaseTableProps<T>) {
  const columnHelper = createColumnHelper<T>()

  const tableColumns = columns.map(column =>
    columnHelper.accessor(row => row[column.name], {
      id: column.name,
      cell: (info) => {
        const value = info.getValue()
        return typeof value === 'object'
          ? JSON.stringify(value)
          : String(value ?? '')
      },
      header: column.name,
    }),
  )

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table className="max-w-full">
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
