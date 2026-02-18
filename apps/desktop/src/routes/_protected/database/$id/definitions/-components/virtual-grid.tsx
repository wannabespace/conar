import type { Key, ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useLayoutEffect, useRef, useState } from 'react'
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
  getItemKey?: (item: T) => Key
}

export function VirtualDefinitionsGrid<T>({
  loading,
  items,
  renderItem,
  emptyState,
  getItemKey,
}: VirtualDefinitionsGridProps<T>) {
  const { scrollRef, isScrollReady } = useDefinitionsScroll()
  const gridRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const scrollEl = scrollRef?.current
    const gridEl = gridRef.current
    if (!scrollEl || !gridEl)
      return

    const measure = () => {
      const scrollRect = scrollEl.getBoundingClientRect()
      const gridRect = gridEl.getBoundingClientRect()
      const offset = gridRect.top - scrollRect.top + scrollEl.scrollTop
      setScrollMargin(offset)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollEl)

    return () => observer.disconnect()
  }, [scrollRef, isScrollReady])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef?.current ?? null,
    getItemKey: getItemKey
      ? (index) => {
          const item = items[index]
          return item != null ? getItemKey(item) : index
        }
      : undefined,
    estimateSize: () => 100,
    overscan: 5,
    scrollMargin,
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
      ref={gridRef}
      className="relative mt-2 w-full"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index]
        if (!item)
          return null
        const rowKey = getItemKey ? getItemKey(item) : virtualRow.key
        return (
          <div
            key={rowKey}
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
