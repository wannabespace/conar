import type { ComponentProps } from 'react'
import type { Column, ColumnRenderer, StoreValue } from '.'
import type { CellUpdaterFunction } from './cells-updater'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { Store, useStore } from '@tanstack/react-store'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, TableBody, TableHeader, TableProvider, TableSkeleton } from '.'
import { Cell } from './cell'
import { HeaderCell } from './header-cell'
import { SelectionCell, SelectionHeaderCell } from './selection'

interface TableState {
  selected?: StoreValue['selected']
  sort?: StoreValue['sort']
  hiddenColumns?: StoreValue['hiddenColumns']
}

export function TableError({ error }: { error: Error }) {
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

export function TableEmpty() {
  return (
    <div className="absolute inset-x-0 pointer-events-none text-muted-foreground h-full flex items-center pb-10 justify-center">
      No data available
    </div>
  )
}

function TableScrollArea({
  children,
  className,
  height,
  ref,
  ...props
}: {
  height: number
} & ComponentProps<'div'>) {
  return (
    <div className={cn('relative size-full', className)} {...props}>
      <ScrollArea
        ref={ref}
        className="size-full overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/15 dark:scrollbar-thumb-white/15"
      >
        <div className="w-full table" style={{ height: `${height}px` }}>
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

const selectSymbol = Symbol('table-selection')

export function Table({
  className,
  data,
  columns,
  selectable = false,
  initialState,
  onUpdate,
  onSelect,
  loading,
  error,
  ...props
}: {
  data: Record<string, unknown>[]
  columns: Column[]
  selectable?: boolean
  initialState?: TableState
  onUpdate?: CellUpdaterFunction
  onSelect?: (rows: number[]) => void
  loading?: boolean
  error?: Error | null
} & Omit<ComponentProps<'div'>, 'onSelect' | 'children'>) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [store] = useState(() => new Store<StoreValue>({
    selected: initialState?.selected ?? [],
    sort: initialState?.sort ?? [],
    hiddenColumns: initialState?.hiddenColumns ?? [],
  }))

  const tableColumns = useMemo(() => {
    const sortedColumns: ColumnRenderer[] = columns
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        name: column.name,
        meta: column,
        size: columnsSizeMap.get(column.type!) ?? DEFAULT_COLUMN_WIDTH,
        cell: Cell,
        header: HeaderCell,
      }) satisfies ColumnRenderer)

    if (selectable) {
      sortedColumns.unshift(
          {
            name: String(selectSymbol),
            cell: SelectionCell,
            header: SelectionHeaderCell,
            size: 40,
          } satisfies ColumnRenderer,
      )
    }

    return sortedColumns
  }, [columns, selectable])

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: 5,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: tableColumns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => tableColumns[index].size ?? DEFAULT_COLUMN_WIDTH,
    overscan: 2,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const tableHeight = rowVirtualizer.getTotalSize()
  const rowWidth = columnVirtualizer.getTotalSize()

  const context = useMemo(() => ({
    store,
    selectable,
    data,
    columns: tableColumns,
    virtualRows,
    virtualColumns,
    rowWidth,
    onUpdate,
    onSelect,
  }), [
    store,
    selectable,
    data,
    columns,
    virtualRows,
    virtualColumns,
    rowWidth,
    onUpdate,
    onSelect,
  ])

  const selectedRows = useStore(store, state => state.selected)

  useEffect(() => {
    onSelect?.(selectedRows)
  }, [selectedRows, onSelect])

  return (
    <TableProvider value={context}>
      <TableScrollArea
        ref={scrollRef}
        height={tableHeight}
        className={className}
        {...props}
      >
        <TableHeader />
        {loading
          ? <TableSkeleton />
          : error
            ? <TableError error={error} />
            : data.length === 0
              ? <TableEmpty />
              : <TableBody />}
      </TableScrollArea>
    </TableProvider>
  )
}
