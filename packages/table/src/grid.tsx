import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import type { Range } from '@tanstack/react-virtual'
import { defaultRangeExtractor } from '@tanstack/react-virtual'
import type { ReactNode, Ref } from 'react'
import { useImperativeHandle, useLayoutEffect } from 'react'

import type { GridColumn } from './columns'
import { columnVars, pinnedCount, pinnedWidth } from './columns'
import { DEFAULT_ROW_HEIGHT, GUTTER_WIDTH } from './constants'
import type { GridCellProps, GridHeaderProps, GridRow } from './grid-row'
import { HeaderRow, Row } from './grid-row'
import type { GridScrollerProps } from './grid-scroller'
import { GridScroller } from './grid-scroller'
import { useColumnDrag } from './use-column-drag'

const ROW_OVERSCAN = 8
const COLUMN_OVERSCAN = 2

export type ScrollToCell = (row: number, column: string) => void

export const Grid = ({
  columns,
  onReorder,
  renderCell,
  renderHeader,
  rows,
  scrollToRef,
  ...scroller
}: GridScrollerProps & {
  columns: GridColumn[]
  onReorder?: (ids: string[]) => void
  renderCell: (props: GridCellProps) => ReactNode
  renderHeader: (props: GridHeaderProps) => ReactNode
  rows: GridRow[]
  scrollToRef?: Ref<ScrollToCell>
}) => {
  const { scrollRef } = scroller
  const drag = useColumnDrag({ columns, onReorder, scrollRef })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    overscan: ROW_OVERSCAN,
  })
  const columnVirtualizer = useVirtualizer({
    count: columns.length,
    estimateSize: (index) => columns[index]?.size ?? 0,
    getItemKey: (index) => columns[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    horizontal: true,
    overscan: COLUMN_OVERSCAN,
    paddingEnd: GUTTER_WIDTH,
    paddingStart: GUTTER_WIDTH,
    // Reads `columns`, not a precomputed count: closing over one makes the compiler drop this options object's memo, and a new extractor every render hands every memoized row a new `virtualColumns`.
    rangeExtractor: (range: Range) =>
      [
        ...new Set([
          ...Array.from({ length: pinnedCount(columns) }, (_, index) => index),
          ...defaultRangeExtractor(range),
        ]),
      ].toSorted((a, b) => a - b),
  })
  const virtualColumns = columnVirtualizer.virtualItems

  useImperativeHandle(scrollToRef, () => (row, column) => {
    rowVirtualizer.scrollToIndex(row, { align: 'center' })
    columnVirtualizer.scrollToIndex(
      columns.findIndex((c) => c.id === column),
      { align: 'center' }
    )
  })

  useLayoutEffect(() => {
    const element = scrollRef.current
    for (const column of columns) {
      const { width } = columnVars(column.id)
      if (element?.style.getPropertyValue(width) !== `${column.size}px`) {
        element?.style.setProperty(width, `${column.size}px`)
      }
    }
  }, [columns, scrollRef])

  return (
    <GridScroller
      {...scroller}
      colCount={columns.length}
      header={
        <HeaderRow
          columns={columns}
          drag={drag}
          renderHeader={renderHeader}
          virtualColumns={virtualColumns}
        />
      }
      pinnedWidth={pinnedWidth(columns)}
      rowCount={rows.length}
      rows={rowVirtualizer}
      width={columnVirtualizer.totalSize}
    >
      {rowVirtualizer.virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index]
        return (
          row && (
            <Row
              key={virtualRow.key}
              columns={columns}
              dragging={drag.dragging}
              renderCell={renderCell}
              row={row}
              rowIndex={virtualRow.index}
              virtualColumns={virtualColumns}
            />
          )
        )
      })}
    </GridScroller>
  )
}
