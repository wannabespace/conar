import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import type { ReactNode } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createStore } from 'seitu'

import type { ColumnRenderer } from './'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from './constants'
import { TableContext } from './table-context'
import { columnWidthProperty } from './utils'

export type { TableContextType } from './table-context'

const ROW_OVERSCAN = 5
const COLUMN_OVERSCAN = 2

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

  const { virtualItems: virtualRows, totalSize: tableHeight } = useVirtualizer({
    count: rows.length,
    estimateSize: () => estimatedRowSize,
    getScrollElement: () => scrollRef.current,
    overscan: ROW_OVERSCAN,
  })

  const {
    virtualItems: virtualColumns,
    totalSize: tableWidth,
    measure,
  } = useVirtualizer({
    count: columns.length,
    estimateSize: (index) => {
      const column = columns[index]
      if (!column) {
        return estimatedColumnSize
      }
      return customColumnSizes?.[column.id] ?? column.size
    },
    getItemKey: (index) => columns[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    horizontal: true,
    overscan: COLUMN_OVERSCAN,
  })

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    scrollElement.style.setProperty(
      '--table-scroll-left-offset',
      `${virtualColumns[0]?.start ?? 0}px`
    )
    scrollElement.style.setProperty(
      '--table-scroll-right-offset',
      `${tableWidth - (virtualColumns.at(-1)?.end ?? 0)}px`
    )
  }, [scrollRef, virtualColumns, tableWidth])

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    for (const column of columns) {
      const size = customColumnSizes?.[column.id]
      const property = columnWidthProperty(column.id)
      if (size === undefined) {
        scrollElement.style.removeProperty(property)
      } else {
        scrollElement.style.setProperty(property, `${size}px`)
      }
    }
    measure()
  }, [scrollRef, customColumnSizes, columns, measure])

  const contextValue = {
    columns,
    rows,
    scrollRef,
    tableHeight,
    tableWidth,
    virtualColumns,
    virtualRows,
  }

  // oxlint-disable-next-line react/hook-use-state, react/refs
  const [store] = useState(() => createStore(contextValue))

  useLayoutEffect(() => {
    store.set(contextValue)
  })

  return <TableContext.Provider value={store}>{children}</TableContext.Provider>
}
