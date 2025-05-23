import type { ComponentProps } from 'react'
import type { ColumnRenderer } from '.'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { useScrollDirection } from '@connnect/ui/hookas/use-scroll-direction'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, TableBody, TableHeader, TableProvider, TableSkeleton } from '.'

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

export function Table({
  className,
  rowsCount,
  columns,
  loading,
  error,
  ...props
}: {
  rowsCount: number
  columns: ColumnRenderer[]
  loading?: boolean
  error?: Error | null
} & Omit<ComponentProps<'div'>, 'onSelect' | 'children'>) {
  'use no memo'
  // no memo due to https://github.com/TanStack/virtual/issues/736

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const rowVirtualizer = useVirtualizer({
    count: rowsCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: scrollDirection === 'down' || scrollDirection === 'up' ? 10 : 0,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index].size ?? DEFAULT_COLUMN_WIDTH,
    overscan: scrollDirection === 'right' || scrollDirection === 'left' ? 5 : 0,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const tableHeight = rowVirtualizer.getTotalSize()
  const rowWidth = columnVirtualizer.getTotalSize()

  const context = useMemo(() => ({
    columns,
    virtualRows,
    virtualColumns,
    rowWidth,
  }), [
    columns,
    virtualRows,
    virtualColumns,
    rowWidth,
  ])

  return (
    <TableProvider value={context}>
      <TableScrollArea
        ref={scrollRef}
        height={tableHeight}
        className={className}
        {...props}
      >
        <TableHeader columns={columns} />
        {loading
          ? <TableSkeleton columnsCount={columns.length || 5} />
          : error
            ? <TableError error={error} />
            : rowsCount === 0
              ? <TableEmpty />
              : <TableBody />}
      </TableScrollArea>
    </TableProvider>
  )
}
