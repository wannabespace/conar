import { ScrollArea, ScrollBar } from '@connnect/ui/components/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@connnect/ui/components/table'
import { cn } from '@connnect/ui/lib/utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface DatabaseTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: {
    name: string
    type?: string
  }[]
  loading?: boolean
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, loading, className }: DatabaseTableProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
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
    }))

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 37,
    scrollMargin: ref.current?.offsetTop ?? 0,
    overscan: 5,
  })

  return (
    <ScrollArea scrollRef={ref} className={cn('h-full', className)}>
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
                    className="font-mono text-xs"
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
                          </div>
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length === 0 || loading
              ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <span className="text-muted-foreground">
                        {loading ? 'Loading...' : 'No data available'}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              : (
                  virtualizer.getVirtualItems().map((virtualRow, index) => {
                    const row = rows[virtualRow.index]
                    return (
                      <TableRow
                        key={row.id}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${
                            virtualRow.start - index * virtualRow.size - (ref.current?.offsetTop ?? 0)
                          }px)`,
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            className="font-mono text-xs max-w-52 truncate"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                )}
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
