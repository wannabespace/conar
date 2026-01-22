import type { ReactNode } from 'react'
import type { ColumnRenderer } from '.'
import { useScrollDirection } from '@conar/ui/hookas/use-scroll-direction'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/connection/components/table/utils'
import { TableContext } from './table-context'

export type { TableContextType } from './table-context'

export function TableProvider({
  rows,
  columns,
  children,
  estimatedRowSize = DEFAULT_ROW_HEIGHT,
  estimatedColumnSize = DEFAULT_COLUMN_WIDTH,
}: {
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  children: ReactNode
  estimatedRowSize?: number
  estimatedColumnSize?: number
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const verticalScroll = scrollDirection === 'up' || scrollDirection === 'down'
  const horizontalScroll = scrollDirection === 'left' || scrollDirection === 'right'

  const { getVirtualItems: getVirtualRows, getTotalSize: getTableHeight } = useVirtualizer({
    useFlushSync: false,
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowSize,
    overscan: verticalScroll || scrollDirection === null ? 10 : 0,
  })

  const { getVirtualItems: getVirtualColumns, getTotalSize: getTableWidth } = useVirtualizer({
    useFlushSync: false,
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => columns[index]!.size ?? estimatedColumnSize,
    overscan: horizontalScroll || scrollDirection === null ? 3 : 0,
  })

  const virtualRows = getVirtualRows()
  const virtualColumns = getVirtualColumns()
  const tableHeight = getTableHeight()
  const tableWidth = getTableWidth()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--table-scroll-left-offset', `${virtualColumns[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--table-scroll-right-offset', `${tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)}px`)
      scrollRef.current.style.setProperty('--table-scroll-top-offset', `${virtualRows[0]?.start ?? 0}px`)
      scrollRef.current.style.setProperty('--table-scroll-bottom-offset', `${tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px`)
    }
  }, [scrollRef, virtualColumns, virtualRows, tableWidth, tableHeight])

  return (
    <TableContext.Provider
      value={{
        scrollRef,
        scrollDirection,
        rows,
        columns,
        virtualRows,
        virtualColumns,
        tableHeight,
        tableWidth,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}
