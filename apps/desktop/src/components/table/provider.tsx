import type { ScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import type { ContextSelector } from '@fluentui/react-context-selector'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ReactNode, RefObject } from 'react'
import type { ColumnRenderer } from '.'
import { useScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import { useVirtual } from '@conar/ui/hooks/use-virtual'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'
import { useEffect, useMemo, useRef } from 'react'

interface TableContextType {
  scrollRef: RefObject<HTMLDivElement | null>
  scrollDirection: ScrollDirection
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  tableHeight: number
  tableWidth: number
}

const TableContext = createContext<TableContextType>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export function useTableContext<T>(selector: ContextSelector<TableContextType, T>) {
  return useContextSelector(TableContext, selector)
}

export function TableProvider({
  rows,
  columns,
  children,
  estimatedRowSize,
  estimatedColumnSize,
}: {
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  children: ReactNode
  estimatedRowSize: number
  estimatedColumnSize: number
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const verticalScroll = scrollDirection === 'up' || scrollDirection === 'down'
  const horizontalScroll = scrollDirection === 'left' || scrollDirection === 'right'

  const { virtualItems: virtualRows, totalSize: tableHeight } = useVirtual({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowSize,
    overscan: verticalScroll || scrollDirection === null ? 10 : 0,
  })

  const { virtualItems: virtualColumns, totalSize: tableWidth } = useVirtual({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index]!.size ?? estimatedColumnSize,
    overscan: horizontalScroll || scrollDirection === null ? 3 : 0,
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--table-scroll-left-offset', `${virtualColumns[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--table-scroll-right-offset', `${tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)}px`)
      scrollRef.current.style.setProperty('--table-scroll-top-offset', `${virtualRows[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--table-scroll-bottom-offset', `${tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px`)
    }
  }, [scrollRef, virtualColumns, virtualRows, tableWidth, tableHeight])

  const context = useMemo(() => ({
    scrollRef,
    scrollDirection,
    rows,
    columns,
    virtualRows,
    virtualColumns,
    tableHeight,
    tableWidth,
  }), [
    scrollRef,
    scrollDirection,
    rows,
    columns,
    virtualRows,
    virtualColumns,
    tableHeight,
    tableWidth,
  ])

  return (
    <TableContext.Provider value={context}>
      {children}
    </TableContext.Provider>
  )
}
