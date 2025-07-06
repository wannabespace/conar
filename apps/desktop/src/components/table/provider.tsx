import type { ContextSelector } from '@fluentui/react-context-selector'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ReactNode, RefObject } from 'react'
import type { ColumnRenderer } from '.'
import { useScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

interface TableContextType {
  scrollRef: RefObject<HTMLDivElement | null>
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  tableHeight: number
  tableWidth: number
}

const TableContext = createContext<TableContextType>(null!)

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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowSize,
    overscan: verticalScroll || scrollDirection === null ? 10 : 0,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index].size ?? estimatedColumnSize,
    overscan: horizontalScroll || scrollDirection === null ? 3 : 0,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  const tableHeight = rowVirtualizer.getTotalSize()
  const tableWidth = columnVirtualizer.getTotalSize()

  const offsets = {
    top: virtualRows[0]?.start ?? 0,
    bottom: tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0),
    left: virtualColumns[0]?.start ?? 0,
    right: tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0),
  }

  if (scrollRef.current) {
    scrollRef.current.style.setProperty('--table-scroll-left-offset', `${offsets.left}px`)
    scrollRef.current.style.setProperty('--table-scroll-right-offset', `${offsets.right}px`)
    scrollRef.current.style.setProperty('--table-scroll-top-offset', `${offsets.top}px`)
    scrollRef.current.style.setProperty('--table-scroll-bottom-offset', `${offsets.bottom}px`)
  }

  const context = useMemo(() => ({
    scrollRef,
    rows,
    columns,
    virtualRows,
    virtualColumns,
    tableHeight,
    tableWidth,
  }), [
    scrollRef,
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
