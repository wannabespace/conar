import type { ColumnDef } from '@tanstack/react-table'
import type { CellMeta } from './cell'
import type { CellUpdaterFunction } from './cells-updater'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { Store, useStore } from '@tanstack/react-store'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, TableStoreContext, VirtualColumnsContext } from '.'
import { Body } from './body'
import { Cell } from './cell'
import { Header } from './header'
import { HeaderCell } from './header-cell'
import { SelectionCell, SelectionHeaderCell } from './selection'
import { Skeleton } from './skeleton'

export interface TableMeta {
  updateCell?: CellUpdaterFunction
}

function Error({ error }: { error: Error }) {
  return (
    <div className="absolute inset-x-0 pointer-events-none h-full flex items-center pb-10 justify-center">
      <div className="flex flex-col items-center p-4 bg-card rounded-lg border max-w-md">
        <div className="flex items-center gap-1 text-destructive mb-2">
          <RiErrorWarningLine className="size-4" />
          <span>Error occurred</span>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          {error.message}
        </p>
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className="absolute inset-x-0 pointer-events-none text-muted-foreground h-full flex items-center pb-10 justify-center">
      No data available
    </div>
  )
}

const selectSymbol = Symbol('select')

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  className,
  selectable,
  updateCell,
  selectedRows,
  setSelectedRows,
  error,
}: {
  data: T[]
  columns: CellMeta[]
  loading?: boolean
  className?: string
  selectable?: boolean
  selectedRows?: number[]
  setSelectedRows?: (rows: number[]) => void
  error?: Error
} & TableMeta) {
  const ref = useRef<HTMLDivElement>(null)

  const tableColumns = useMemo(() => {
    const sortedColumns: ColumnDef<Record<string, unknown>>[] = columns
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        accessorFn: row => row[column.name],
        id: column.name,
        meta: column satisfies CellMeta,
        enableSorting: false,
        cell: Cell,
        header: HeaderCell,
        size: (column.type && columnsSizeMap.get(column.type)) || DEFAULT_COLUMN_WIDTH,
      }))

    if (selectable) {
      sortedColumns.unshift(
        {
          id: selectSymbol as unknown as string,
          enableSorting: false,
          cell: SelectionCell,
          header: SelectionHeaderCell,
          size: 40,
        },
      )
    }

    return sortedColumns
  }, [columns, selectable])

  const table = useReactTable({
    data,
    columns: tableColumns,
    meta: {
      updateCell,
    } satisfies TableMeta,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    count: tableColumns.length,
    getScrollElement: () => ref.current,
    estimateSize: index => tableColumns[index].size ?? DEFAULT_COLUMN_WIDTH,
    overscan: 2,
  })

  const rowWidth = columnVirtualizer.getTotalSize()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  const [selectionStoreContext] = useState(() => new Store({
    selected: [] as number[],
    rows: rows.map(row => row.index),
  }))

  const selected = useStore(selectionStoreContext, state => state.selected)

  useEffect(() => {
    setSelectedRows?.(selected)
  }, [selected, setSelectedRows])

  useEffect(() => {
    selectionStoreContext.setState(state => ({
      ...state,
      selected: selectedRows ?? [],
    }))
  }, [selectedRows])

  useEffect(() => {
    selectionStoreContext.setState(state => ({
      ...state,
      rows: rows.map(row => row.index),
    }))
  }, [rows])

  return (
    <div className={cn('relative', className)}>
      <ScrollArea ref={ref} className="h-full">
        <div className="w-full table" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <TableStoreContext value={selectionStoreContext}>
            <VirtualColumnsContext value={virtualColumns}>
              <Header
                headerGroups={table.getHeaderGroups()}
                rowWidth={rowWidth}
              />
              {loading
                ? <Skeleton columnsCount={columns.length || 5} />
                : error
                  ? <Error error={error} />
                  : data.length === 0
                    ? <Empty />
                    : (
                        <Body
                          rows={rows}
                          rowWidth={rowWidth}
                          virtualRows={rowVirtualizer.getVirtualItems()}
                        />
                      )}
            </VirtualColumnsContext>
          </TableStoreContext>
        </div>
      </ScrollArea>
    </div>
  )
}
