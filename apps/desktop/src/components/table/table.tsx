import type { ComponentProps } from 'react'
import type { ColumnRenderer } from '.'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { useScrollDirection } from '@connnect/ui/hookas/use-scroll-direction'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '.'
import { TableProvider } from './provider'

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

export function Table({
  className,
  rows,
  columns,
  children,
  ...props
}: {
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
} & Omit<ComponentProps<'div'>, 'ref' | 'onSelect'>) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const verticalScroll = scrollDirection === 'up' || scrollDirection === 'down'
  const horizontalScroll = scrollDirection === 'left' || scrollDirection === 'right'

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: verticalScroll ? 20 : (scrollDirection === null ? 5 : 0),
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index].size ?? DEFAULT_COLUMN_WIDTH,
    overscan: horizontalScroll ? 5 : (scrollDirection === null ? 2 : 0),
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  const tableHeight = rowVirtualizer.getTotalSize()
  const tableWidth = columnVirtualizer.getTotalSize()

  const offsets = useMemo(() => {
    const top = virtualRows[0]?.start ?? 0
    const bottom = tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    const left = virtualColumns[0]?.start ?? 0
    const right = tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)

    return { top, bottom, left, right }
  }, [virtualRows, virtualColumns, tableHeight, tableWidth])

  if (scrollRef.current) {
    scrollRef.current.style.setProperty('--table-scroll-left-offset', `${offsets.left}px`)
    scrollRef.current.style.setProperty('--table-scroll-right-offset', `${offsets.right}px`)
    scrollRef.current.style.setProperty('--table-scroll-top-offset', `${offsets.top}px`)
    scrollRef.current.style.setProperty('--table-scroll-bottom-offset', `${offsets.bottom}px`)
  }

  const context = useMemo(() => ({
    rows,
    columns,
    virtualRows,
    virtualColumns,
  }), [rows, columns, virtualRows, virtualColumns])

  return (
    <TableProvider value={context}>
      <div
        className={cn('size-full relative', className)}
        {...props}
      >
        <ScrollArea
          ref={scrollRef}
          className="size-full"
        >
          {children}
        </ScrollArea>
      </div>
    </TableProvider>
  )
}
