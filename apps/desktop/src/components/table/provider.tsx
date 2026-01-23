import type { ReactNode } from 'react'
import type { ColumnRenderer } from '.'
import { useDebouncedCallback } from '@conar/ui/hookas/use-debounced-callback'
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
  customColumnSizes,
}: {
  rows: Record<string, unknown>[]
  columns: ColumnRenderer[]
  children: ReactNode
  estimatedRowSize?: number
  estimatedColumnSize?: number
  customColumnSizes?: Record<string, number>
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const verticalScroll = scrollDirection === 'up' || scrollDirection === 'down'
  const horizontalScroll = scrollDirection === 'left' || scrollDirection === 'right'

  const { getVirtualItems: getVirtualRows, getTotalSize: getTableHeight } = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowSize,
    overscan: (verticalScroll || scrollDirection === null) ? 10 : 0,
  })

  const { getVirtualItems: getVirtualColumns, getTotalSize: getTableWidth, measure } = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: index => customColumnSizes?.[columns[index]!.id] ?? columns[index]!.size ?? estimatedColumnSize,
    overscan: (horizontalScroll || scrollDirection === null) ? 3 : 0,
  })

  const virtualRows = getVirtualRows()
  const virtualColumns = getVirtualColumns()
  const tableHeight = getTableHeight()
  const tableWidth = getTableWidth()

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    scrollRef.current.style.setProperty('--table-scroll-left-offset', `${virtualColumns[0]?.start ?? 0}px`)
    scrollRef.current.style.setProperty('--table-scroll-right-offset', `${tableWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)}px`)
    scrollRef.current.style.setProperty('--table-scroll-top-offset', `${virtualRows[0]?.start ?? 0}px`)
    scrollRef.current.style.setProperty('--table-scroll-bottom-offset', `${tableHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px`)
  }, [scrollRef, virtualColumns, virtualRows, tableWidth, tableHeight])

  const measureDebounced = useDebouncedCallback(measure, [], 250)

  useEffect(() => {
    if (!scrollRef.current || !customColumnSizes)
      return

    const customColumnsSizesMap = new Map(Object.entries(customColumnSizes))
    const columnsToRemove = columns.filter(column => !customColumnsSizesMap.has(column.id))

    requestAnimationFrame(() => {
      columnsToRemove.forEach((column) => {
        const id = `--table-column-width-${column.id}`

        if (scrollRef.current!.style.getPropertyValue(id)) {
          scrollRef.current!.style.removeProperty(id)
        }
      })
      customColumnsSizesMap.forEach((size, id) => {
        scrollRef.current!.style.setProperty(`--table-column-width-${id}`, `${size}px`)
      })
      measureDebounced()
    })
  }, [scrollRef, customColumnSizes, columns, measureDebounced])

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
