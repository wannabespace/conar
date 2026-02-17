import type { ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useDefinitionsScroll } from '../../definitions'

function Skeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="
            flex w-full flex-col gap-3 rounded-xl border border-border/40
            bg-muted/10 p-4
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-5 animate-pulse rounded-md bg-muted/20" />
              <div className="h-5 w-48 animate-pulse rounded-md bg-muted/20" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted/20" />
            </div>
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted/20" />
          </div>
          <div className="flex gap-2 pl-8">
            <div className="h-5 w-16 animate-pulse rounded-md bg-muted/20" />
            <div className="h-5 w-24 animate-pulse rounded-md bg-muted/20" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface VirtualDefinitionsGridProps<T> {
  loading: boolean
  items: T[]
  renderItem: (item: T) => ReactNode
  emptyState?: ReactNode
}

export function VirtualDefinitionsGrid<T>({
  loading,
  items,
  renderItem,
  emptyState,
}: VirtualDefinitionsGridProps<T>) {
  const { scrollRef, isScrollReady } = useDefinitionsScroll()

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef?.current ?? null,
    estimateSize: () => 100,
    overscan: 5,
  })

  if (!isScrollReady || loading) {
    return (
      <div className="mt-2 grid grid-cols-1 gap-4">
        <Skeleton />
      </div>
    )
  }

  if (items.length === 0 && emptyState) {
    return (
      <div className="mt-2 grid grid-cols-1 gap-4">
        {emptyState}
      </div>
    )
  }

  return (
    <div
      className="relative mt-2 w-full"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index]
        if (!item)
          return null
        return (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute top-0 left-0 w-full pb-4"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(item)}
          </div>
        )
      })}
    </div>
  )
}
