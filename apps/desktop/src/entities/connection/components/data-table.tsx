import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@connnect/ui/components/table'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

interface DatabaseTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: {
    name: string
    type?: string
  }[]
  scrollRef: React.RefObject<Element | null>
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, scrollRef }: DatabaseTableProps<T>) {
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
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 37,
    overscan: 5,
  })

  return (
    <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className="font-mono"
                >
                  {header.isPlaceholder
                    ? null
                    : (
                        <div
                          className={header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {virtualizer.getVirtualItems().map((virtualRow, index) => {
            const row = rows[virtualRow.index]
            return (
              <TableRow
                key={row.id}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${
                    virtualRow.start - index * virtualRow.size
                  }px)`,
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className="font-mono"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
