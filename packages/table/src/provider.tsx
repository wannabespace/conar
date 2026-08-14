import { useDebouncedCallback } from '@tamery/ui/hookas/use-debounced-callback'
import { useScrollDirection } from '@tamery/ui/hookas/use-scroll-direction'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'

import type { ColumnRenderer } from './'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from './constants'
import { TableContext } from './table-context'
import { prepareColumnId } from './utils'

export type { TableContextType } from './table-context'

export const TableProvider = ({
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
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollDirection = useScrollDirection(scrollRef)

  const verticalScroll = scrollDirection === 'up' || scrollDirection === 'down'
  const horizontalScroll =
    scrollDirection === 'left' || scrollDirection === 'right'

  const { getVirtualItems: getVirtualRows, getTotalSize: getTableHeight } =
    useVirtualizer({
      count: rows.length,
      estimateSize: () => estimatedRowSize,
      getScrollElement: () => scrollRef.current,
      overscan: verticalScroll || scrollDirection === null ? 10 : 0,
    })

  const {
    getVirtualItems: getVirtualColumns,
    getTotalSize: getTableWidth,
    measure,
  } = useVirtualizer({
    count: columns.length,
    estimateSize: (index) => {
      const column = columns[index]
      if (!column) {
        return estimatedColumnSize
      }
      return (
        customColumnSizes?.[column.id] ?? column.size ?? estimatedColumnSize
      )
    },
    getScrollElement: () => scrollRef.current,
    horizontal: true,
    overscan: horizontalScroll || scrollDirection === null ? 3 : 0,
  })

  const virtualRows = getVirtualRows()
  const virtualColumns = getVirtualColumns()
  const tableHeight = getTableHeight()
  const tableWidth = getTableWidth()

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    scrollRef.current.style.setProperty(
      '--table-scroll-left-offset',
      `${virtualColumns[0]?.start ?? 0}px`
    )
    scrollRef.current.style.setProperty(
      '--table-scroll-right-offset',
      `${tableWidth - (virtualColumns.at(-1)?.end ?? 0)}px`
    )
    scrollRef.current.style.setProperty(
      '--table-scroll-top-offset',
      `${virtualRows[0]?.start ?? 0}px`
    )
    scrollRef.current.style.setProperty(
      '--table-scroll-bottom-offset',
      `${tableHeight - (virtualRows.at(-1)?.end ?? 0)}px`
    )
  }, [scrollRef, virtualColumns, virtualRows, tableWidth, tableHeight])

  const measureDebounced = useDebouncedCallback(measure, [], 250)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || !customColumnSizes) {
      return
    }

    const customColumnsSizesMap = new Map(Object.entries(customColumnSizes))
    const columnsToRemove = columns.filter(
      (column) => !customColumnsSizesMap.has(column.id)
    )

    const rafId = requestAnimationFrame(() => {
      for (const column of columnsToRemove) {
        const id = `--table-column-width-${prepareColumnId(column.id)}`

        if (scrollElement.style.getPropertyValue(id)) {
          scrollElement.style.removeProperty(id)
        }
      }
      for (const [id, size] of customColumnsSizesMap) {
        scrollElement.style.setProperty(
          `--table-column-width-${prepareColumnId(id)}`,
          `${size}px`
        )
      }
      measureDebounced()
    })

    return () => cancelAnimationFrame(rafId)
  }, [scrollRef, customColumnSizes, columns, measureDebounced])

  const contextValue = useMemo(
    () => ({
      columns,
      rows,
      scrollDirection,
      scrollRef,
      tableHeight,
      tableWidth,
      virtualColumns,
      virtualRows,
    }),
    [
      scrollRef,
      scrollDirection,
      rows,
      columns,
      virtualRows,
      virtualColumns,
      tableHeight,
      tableWidth,
    ]
  )

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  )
}
