import type {
  CellContext,
  ColumnDef,
} from '@tanstack/react-table'
import type { CellMeta } from './cell'
import type { CellUpdaterFunction } from './cells-updater'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { Store, useStore } from '@tanstack/react-store'
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, SelectionStoreContext, useSelectionStoreContext, VirtualColumnsContext } from '.'
import { Body } from './body'
import { Cell } from './cell'
import { IndeterminateCheckbox } from './checkbox'
import { Header } from './header'
import { HeaderCell } from './header-cell'
import { Skeleton } from './skeleton'

export interface TableMeta {
  updateCell?: CellUpdaterFunction
}

function SelectedHeader() {
  const store = useSelectionStoreContext()
  const [disabled, checked, indeterminate] = useStore(store, state => [
    state.rows.length === 0,
    state.rows.length > 0 && state.selected.length === state.rows.length,
    state.selected.length > 0,
  ])

  return (
    <div className="group-first/header:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        disabled={disabled}
        checked={checked}
        indeterminate={indeterminate}
        onChange={() => {
          if (checked) {
            store.setState(state => ({
              ...state,
              selected: [],
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: state.rows,
            }))
          }
        }}
      />
    </div>
  )
}

function SelectionCell({ row }: CellContext<Record<string, unknown>, unknown>) {
  const store = useSelectionStoreContext()
  const isSelected = useStore(store, state => state.selected.includes(row.index))

  return (
    <div className="group-first/cell:pl-4 flex items-center size-full">
      <IndeterminateCheckbox
        checked={isSelected}
        onChange={() => {
          if (isSelected) {
            store.setState(state => ({
              ...state,
              selected: store.state.selected.filter(index => index !== row.index),
            }))
          }
          else {
            store.setState(state => ({
              ...state,
              selected: [...state.selected, row.index],
            }))
          }
        }}
      />
    </div>
  )
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
        cell: Cell,
        header: HeaderCell,
        size: (column.type && columnsSizeMap.get(column.type)) || DEFAULT_COLUMN_WIDTH,
      }))

    if (selectable) {
      sortedColumns.unshift(
        {
          id: selectSymbol as unknown as string,
          size: 40,
          header: SelectedHeader,
          cell: SelectionCell,
        },
      )
    }

    return sortedColumns
  }, [columns, selectable])

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

  const allColumns = table.getAllColumns()

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: allColumns.length,
    getScrollElement: () => ref.current,
    estimateSize: index => allColumns[index].getSize(),
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
          <SelectionStoreContext value={selectionStoreContext}>
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
          </SelectionStoreContext>
        </div>
      </ScrollArea>
    </div>
  )
}
