import type { Cell, Header, HeaderGroup, Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { ScrollArea, ScrollBar } from '@connnect/ui/components/scroll-area'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

function TableHead<T extends Record<string, unknown>>({ header }: { header: Header<T, unknown> }) {
  return (
    <div
      key={header.id}
      style={{ width: `${header.getSize()}px` }}
      className="shrink-0 text-xs py-2 pl-4"
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
    </div>
  )
}

function TableHeader<T extends Record<string, unknown>>({ headerGroups, virtualColumns, rowWidth }: {
  headerGroups: HeaderGroup<T>[]
  virtualColumns: VirtualItem[]
  rowWidth: number
}) {
  return (
    <div className="sticky top-0 z-10 border-y bg-card">
      {headerGroups.map(headerGroup => (
        <div
          key={headerGroup.id}
          className="flex h-8 has-[[data-type]]:h-12 relative"
          style={{ width: `${rowWidth}px` }}
        >
          {virtualColumns.map((virtualColumn) => {
            const header = headerGroup.headers[virtualColumn.index]
            return (
              <div
                key={header.id}
                className="absolute top-0 left-0 h-full"
                style={{
                  transform: `translateX(${virtualColumn.start}px)`,
                  width: `${header.getSize()}px`,
                }}
              >
                <TableHead header={header} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function TableCell<T extends Record<string, unknown>>({ cell }: {
  cell: Cell<T, unknown>
}) {
  return (
    <div
      key={cell.id}
      className="shrink-0 text-xs truncate py-2 pl-4 font-mono"
      style={{
        width: `${cell.column.getSize()}px`,
      }}
    >
      {flexRender(
        cell.column.columnDef.cell,
        cell.getContext(),
      )}
    </div>
  )
}

function TableRow<T extends Record<string, unknown>>({ row, virtualRow, virtualColumns, rowWidth }: {
  row: Row<T>
  virtualRow: VirtualItem
  virtualColumns: VirtualItem[]
  rowWidth: number
}) {
  return (
    <div
      className="flex absolute top-0 left-0 w-full border-b last:border-b-0 min-w-full border-border hover:bg-muted/50"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translate3d(0,${virtualRow.start}px,0)`,
        width: `${rowWidth}px`,
      }}
    >
      {virtualColumns.map((virtualColumn) => {
        const cell = row.getVisibleCells()[virtualColumn.index]
        return (
          <div
            key={virtualColumn.key}
            className="group absolute top-0 left-0 h-full"
            style={{
              transform: `translateX(${virtualColumn.start}px)`,
              width: `${cell.column.getSize()}px`,
            }}
          >
            <TableCell cell={cell} />
          </div>
        )
      })}
    </div>
  )
}

function TableSkeleton({ virtualColumns, rowWidth, count = 5 }: {
  virtualColumns: VirtualItem[]
  rowWidth: number
  count?: number
}) {
  return (
    <div className="relative flex flex-col">
      {Array.from({ length: count }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex absolute top-0 left-0 w-full border-b last:border-b-0 min-w-full border-border"
          style={{
            height: '35px',
            transform: `translate3d(0,${rowIndex * 35}px,0)`,
            width: `${rowWidth}px`,
          }}
        >
          {virtualColumns.map(virtualColumn => (
            <div
              key={virtualColumn.key}
              className="group absolute top-0 left-0 h-full"
              style={{
                transform: `translateX(${virtualColumn.start}px)`,
                width: `${virtualColumn.size}px`,
              }}
            >
              <div
                className="shrink-0 text-xs truncate py-2 pl-4 h-full"
                style={{
                  width: `${virtualColumn.size}px`,
                }}
              >
                <div className="h-4 bg-muted animate-pulse rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  className,
}: {
  data: T[]
  columns: {
    name: string
    type?: string
  }[]
  loading?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const columnHelper = createColumnHelper<T>()

  const tableColumns = columns.map(column =>
    columnHelper.accessor(row => row[column.name], {
      id: column.name,
      cell: (info) => {
        const value = info.getValue()

        if (value instanceof Date)
          return value.toISOString()

        if (typeof value === 'object')
          return JSON.stringify(value)

        return String(value ?? '')
      },
      header: () => (
        <>
          <div className="truncate font-medium">
            {column.name}
          </div>
          {column.type && (
            <span data-type={column.type} className="text-muted-foreground text-xs font-mono">
              {column.type}
            </span>
          )}
        </>
      ),
      size: 200,
    }),
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 35,
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

  const rowWidth = columnVirtualizer.getTotalSize()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <ScrollArea scrollRef={ref} className={className} tableStyle>
      <div className="w-full" style={{ height: `${rowVirtualizer.getTotalSize() || 200}px` }}>
        <TableHeader
          headerGroups={table.getHeaderGroups()}
          virtualColumns={virtualColumns}
          rowWidth={rowWidth}
        />
        {loading
          ? (
              <TableSkeleton
                virtualColumns={virtualColumns}
                rowWidth={rowWidth}
              />
            )
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
