import type {
  CellContext,
  ColumnDef,
  HeaderContext,
  OnChangeFn,
  RowSelectionState,
} from '@tanstack/react-table'
import type { TableCellMeta } from './cell'
import type { CellUpdaterFunction } from './cells-updater'
import { ScrollArea, ScrollBar } from '@connnect/ui/components/scroll-area'
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '.'
import { TableCell } from './cell'
import { IndeterminateCheckbox } from './checkbox'
import { TableHead } from './head'
import { TableHeader } from './header'
import { TableRow } from './row'
import { TableSkeleton } from './skeleton'

export interface TableMeta {
  updateCell?: CellUpdaterFunction
}

function SelectedHeader({ table }: HeaderContext<Record<string, unknown>, unknown>) {
  'use no memo'

  return (
    <div className="group-first/header:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        disabled={table.getRowCount() === 0}
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    </div>
  )
}

function SelectedCell({ row }: CellContext<Record<string, unknown>, unknown>) {
  'use no memo'
  return (
    <div className="group-first/cell:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    </div>
  )
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  className,
  selectable,
  updateCell,
  selectedRows,
  setSelectedRows,
}: {
  data: T[]
  columns: TableCellMeta[]
  loading?: boolean
  className?: string
  selectable?: boolean
  selectedRows?: Record<string, boolean>
  setSelectedRows?: OnChangeFn<RowSelectionState>
} & TableMeta) {
  const ref = useRef<HTMLDivElement>(null)

  const tableColumns = useMemo(() => {
    const sortedColumns: ColumnDef<Record<string, unknown>>[] = columns
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        accessorFn: row => row[column.name],
        id: column.name,
        meta: column satisfies TableCellMeta,
        cell: TableCell,
        header: TableHead,
        size: (column.type && columnsSizeMap.get(column.type)) || DEFAULT_COLUMN_WIDTH,
      }))

    if (selectable) {
      sortedColumns.unshift(
        {
          id: 'select',
          size: 40,
          header: SelectedHeader,
          cell: SelectedCell,
        },
      )
    }

    return sortedColumns
  }, [columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    enableSorting: false,
    meta: {
      updateCell,
    } satisfies TableMeta,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection: selectedRows,
    },
    enableRowSelection: selectable,
    onRowSelectionChange: setSelectedRows,
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => ref.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    scrollMargin: ref.current?.offsetTop ?? 0,
    overscan: 5,
  })

  const allColumns = table.getAllColumns()

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: allColumns.length,
    getScrollElement: () => ref.current,
    estimateSize: index => allColumns[index].getSize(),
    overscan: 1,
  })

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
          ? <TableSkeleton columnsCount={allColumns.length || 5} />
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
