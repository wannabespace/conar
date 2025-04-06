import type { TableCellMeta } from './cell'
import type { CellUpdaterFunction } from './cells-updater'
import { ScrollArea, ScrollBar } from '@connnect/ui/components/scroll-area'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '.'
import { TableCell } from './cell'
import { TableHead } from './head'
import { TableHeader } from './header'
import { TableRow } from './row'
import { TableSkeleton } from './skeleton'

const columnHelper = createColumnHelper<Record<string, unknown>>()

export interface TableMeta {
  updateCell?: CellUpdaterFunction
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  className,
  updateCell,
}: {
  data: T[]
  columns: TableCellMeta[]
  loading?: boolean
  className?: string
} & TableMeta) {
  const ref = useRef<HTMLDivElement>(null)

  const tableColumns = useMemo(() => columns
    .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
    .map(column =>
      columnHelper.accessor(row => row[column.name], {
        id: column.name,
        meta: column satisfies TableCellMeta,
        cell: TableCell,
        header: TableHead,
        size: (column.type && columnsSizeMap.get(column.type)) || DEFAULT_COLUMN_WIDTH,
      }),
    ), [columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    enableSorting: false,
    meta: {
      updateCell,
    } satisfies TableMeta,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => ref.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    scrollMargin: ref.current?.offsetTop ?? 0,
    overscan: 5,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: table.getAllColumns().length,
    getScrollElement: () => ref.current,
    estimateSize: index => table.getAllColumns()[index].getSize(),
    overscan: 1,
  })

  // https://github.com/TanStack/virtual/discussions/379#discussioncomment-3501037
  useEffect(() => {
    columnVirtualizer.measure()
  }, [columnVirtualizer, columns])

  const rowWidth = columnVirtualizer.getTotalSize()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <ScrollArea scrollRef={ref} className={className} tableStyle>
      <div className="w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <TableHeader
          headerGroups={table.getHeaderGroups()}
          virtualColumns={virtualColumns}
          rowWidth={rowWidth}
        />
        {loading
          ? <TableSkeleton columnsCount={table.getAllColumns().length || 5} />
          : data.length === 0
            ? (
                <div className="absolute inset-x-0 pointer-events-none text-muted-foreground h-full flex items-center pb-10 justify-center">
                  No data available
                </div>
              )
            : (
                <div className="relative flex flex-col">
                  {rowVirtualizer.getVirtualItems().map(virtualRow => (
                    <TableRow
                      key={virtualRow.key}
                      row={rows[virtualRow.index]}
                      virtualRow={virtualRow}
                      virtualColumns={virtualColumns}
                      rowWidth={rowWidth}
                    />
                  ))}
                </div>
              )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
