import type { ComponentProps } from 'react'
import type { ColumnRenderer } from '.'
import { ScrollArea } from '@connnect/ui/components/custom/scroll-area'
import { useScrollDirection } from '@connnect/ui/hookas/use-scroll-direction'
import { cn } from '@connnect/ui/lib/utils'
import { RiErrorWarningLine } from '@remixicon/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, TableBody, TableHeader, TableSkeleton } from '.'

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
  data,
  columns,
  loading,
  error,
  ...props
}: {
  data: Record<string, unknown>[]
  columns: ColumnRenderer[]
  loading?: boolean
  error?: Error | null
} & Omit<ComponentProps<'div'>, 'ref' | 'onSelect' | 'children'>) {
  'use no memo'

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: scrollDirection === 'up' || scrollDirection === 'down' ? 10 : 0,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index].size ?? DEFAULT_COLUMN_WIDTH,
    overscan: scrollDirection === 'left' || scrollDirection === 'right' ? 5 : 0,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  const tableHeight = rowVirtualizer.getTotalSize()
  const tableWidth = columnVirtualizer.getTotalSize()

  const virtualTopOffset = virtualRows[0]?.start ?? 0
  const virtualBottomOffset = tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)

  const virtualLeftOffset = virtualColumns[0]?.start ?? 0
  const virtualRightOffset = tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)

  if (scrollRef.current) {
    scrollRef.current.style.setProperty('--scroll-left-offset', `${virtualLeftOffset}px`)
    scrollRef.current.style.setProperty('--scroll-right-offset', `${virtualRightOffset}px`)
    scrollRef.current.style.setProperty('--scroll-top-offset', `${virtualTopOffset}px`)
    scrollRef.current.style.setProperty('--scroll-bottom-offset', `${virtualBottomOffset}px`)
  }

  return (
    <div
      className={cn('size-full relative', className)}
      {...props}
    >
      <ScrollArea
        ref={scrollRef}
        className="size-full"
      >
        <TableHeader
          columns={columns}
          virtualColumns={virtualColumns}
        />
        {loading
          ? <TableSkeleton columnsCount={columns.length || 5} />
          : error
            ? <TableError error={error} />
            : data.length === 0
              ? <TableEmpty />
              : (
                  <TableBody
                    columns={columns}
                    virtualColumns={virtualColumns}
                    virtualRows={virtualRows}
                    data={data}
                  />
                )}
      </ScrollArea>
    </div>
  )
}
