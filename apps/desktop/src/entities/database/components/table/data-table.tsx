import type { HeaderGroup, Row } from '@tanstack/react-table'
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

interface DatabaseTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: {
    name: string
    type?: string
  }[]
  loading?: boolean
  className?: string
}

interface TableHeaderProps<T extends Record<string, unknown>> {
  headerGroups: HeaderGroup<T>[]
}

function TableHeader<T extends Record<string, unknown>>({ headerGroups }: TableHeaderProps<T>) {
  return (
    <div className="sticky top-0 z-10 border-b-2 border-border bg-background">
      {headerGroups.map(headerGroup => (
        <div key={headerGroup.id} className="flex">
          {headerGroup.headers.map(header => (
            <div
              key={header.id}
              style={{ width: `${header.getSize()}px` }}
              className="font-mono shrink-0 text-xs p-2"
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
          ))}
        </div>
      ))}
    </div>
  )
}

interface TableRowsProps<T extends Record<string, unknown>> {
  virtualItems: VirtualItem[]
  rows: Row<T>[]
}

function TableRows<T extends Record<string, unknown>>({ virtualItems, rows }: TableRowsProps<T>) {
  return (
    <div className="relative flex flex-col">
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index]
        return (
          <div
            key={row.id}
            className="flex absolute w-full will-change-transform border-b last:border-b-0 border-border hover:bg-muted/30"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {row.getVisibleCells().map(cell => (
              <div
                key={cell.id}
                className="font-mono shrink-0 text-xs truncate p-2"
                style={{
                  width: `${cell.column.getSize()}px`,
                }}
              >
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, loading, className }: DatabaseTableProps<T>) {
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
          <div className="truncate">
            {column.name}
          </div>
          {column.type && (
            <>
              <span className="text-muted-foreground text-[0.6rem]">
                {column.type}
              </span>
            </>
          )}
        </>
      ),
      size: 200,
    }))

  const table = useReactTable({
    data,
    columns: tableColumns,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 35,
    scrollMargin: ref.current?.offsetTop ?? 0,
    overscan: 10,
  })

  return (
    <ScrollArea scrollRef={ref} className={className}>
      <div className="w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <TableHeader headerGroups={table.getHeaderGroups()} />
        {data.length === 0 || loading
          ? (
              <div className="absolute inset-x-0 pointer-events-none text-muted-foreground h-full flex items-center justify-center">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )
          : <TableRows virtualItems={virtualizer.getVirtualItems()} rows={rows} />}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
