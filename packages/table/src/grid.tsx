/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useVirtualizer } from '@tamery/ui/hooks/use-virtualizer'
import { cn } from '@tamery/ui/lib/utils'
import type { Range, VirtualItem } from '@tanstack/react-virtual'
import { defaultRangeExtractor } from '@tanstack/react-virtual'
import type { CSSProperties, ReactNode, Ref, RefObject } from 'react'
import { Fragment, memo, useImperativeHandle, useLayoutEffect } from 'react'

import type { GridColumn } from './columns'
import { columnStyle, columnVars } from './columns'
import { DEFAULT_ROW_HEIGHT } from './constants'
import type { ColumnDragHandle } from './use-column-drag'
import { useColumnDrag } from './use-column-drag'
import { useEndReached } from './use-end-reached'

const ROW_OVERSCAN = 8
const COLUMN_OVERSCAN = 2
const END_REACHED_ROWS = 20
// Inset of the first and last column; the table skeleton copies it as `w-2`.
const GUTTER = 8
// The first child is the gutter spacer and the last the trailing column, so rules sit between columns only.
const COLUMN_RULES = '*:not-first:not-last:border-r'
const GRID_ROW_CLASS = `group/row row-hover:bg-accent relative flex h-(--grid-row-height) w-full border-b contain-layout contain-style ${COLUMN_RULES}`

export type GridRow = Record<string, unknown>

export type ScrollToCell = (row: number, column: string) => void

export interface GridHeaderProps {
  column: GridColumn
  dragHandle: ColumnDragHandle
  isDragging: boolean
  /** Moves the column edge live during a resize drag, before the size commits. */
  setWidth: (width: number) => void
  style: CSSProperties
}

export interface GridCellProps {
  column: GridColumn
  isDragging: boolean
  row: GridRow
  rowIndex: number
  style: CSSProperties
}

const pinnedCount = (columns: GridColumn[]) => {
  const index = columns.findIndex((column) => !column.pinned)
  return index === -1 ? columns.length : index
}

// Live widths, so a pinned column's offset follows a resize drag of the ones before it.
const pinnedLeft = (columns: GridColumn[], index: number) =>
  `calc(${[`${GUTTER}px`, ...columns.slice(0, index).map((column) => `var(${columnVars(column.id).width})`)].join(' + ')})`

const cellStyle = (
  columns: GridColumn[],
  column: GridColumn,
  index: number
): CSSProperties =>
  column.pinned
    ? {
        ...columnStyle(column.id),
        left: pinnedLeft(columns, index),
        position: 'sticky',
      }
    : columnStyle(column.id)

const renderColumns = (
  columns: GridColumn[],
  virtualColumns: VirtualItem[],
  render: (column: GridColumn, index: number) => ReactNode
) => {
  const pinned = pinnedCount(columns)
  return (
    <>
      <div
        aria-hidden
        style={
          {
            '--grid-left': `${virtualColumns[0]?.start ?? 0}px`,
          } as CSSProperties
        }
        className={cn(
          'w-(--grid-left) shrink-0',
          pinned > 0 && 'bg-background row-hover:bg-accent sticky left-0 z-10'
        )}
      />
      {virtualColumns.map(({ index }, position) => {
        const column = columns[index]
        return (
          column && (
            <Fragment key={column.id}>
              {/* Pinned columns stay rendered while the rest virtualize, so the columns scrolled out between the last pinned one and the next rendered one need this spacer. */}
              {position > 0 && position === pinned && (
                <div
                  aria-hidden
                  style={
                    {
                      '--grid-gap': `${(virtualColumns[pinned]?.start ?? 0) - (virtualColumns[pinned - 1]?.end ?? 0)}px`,
                    } as CSSProperties
                  }
                  className="w-(--grid-gap) shrink-0 border-r-0!"
                />
              )}
              {render(column, index)}
            </Fragment>
          )
        )
      })}
    </>
  )
}

// Rendered through memo components so a column-range change re-renders only the cells and headers it mounts, not every visible one.
const CellBase = ({
  columns,
  index,
  renderCell,
  ...props
}: Omit<GridCellProps, 'style'> & {
  columns: GridColumn[]
  index: number
  renderCell: (props: GridCellProps) => ReactNode
}) => renderCell({ ...props, style: cellStyle(columns, props.column, index) })

const Cell = memo(CellBase)

const HeaderBase = ({
  column,
  columns,
  handlers,
  index,
  isDragging,
  renderHeader,
  setWidth,
}: {
  column: GridColumn
  columns: GridColumn[]
  handlers: Omit<ColumnDragHandle, 'data-grid-column'>
  index: number
  isDragging: boolean
  renderHeader: (props: GridHeaderProps) => ReactNode
  setWidth: (id: string, width: number) => void
}) =>
  renderHeader({
    column,
    dragHandle: { ...handlers, 'data-grid-column': column.id },
    isDragging,
    setWidth: (width) => setWidth(column.id, width),
    style: cellStyle(columns, column, index),
  })

const Header = memo(HeaderBase)

interface RowProps {
  columns: GridColumn[]
  dragging: string | null
  renderCell: (props: GridCellProps) => ReactNode
  row: GridRow
  rowIndex: number
  virtualColumns: VirtualItem[]
}

const RowBase = ({
  columns,
  dragging,
  renderCell,
  row,
  rowIndex,
  virtualColumns,
}: RowProps) => (
  <div
    role="row"
    data-grid-row
    aria-rowindex={rowIndex + 2}
    className={GRID_ROW_CLASS}
  >
    {renderColumns(columns, virtualColumns, (column, index) => (
      <Cell
        column={column}
        columns={columns}
        index={index}
        isDragging={dragging === column.id}
        renderCell={renderCell}
        row={row}
        rowIndex={rowIndex}
      />
    ))}
  </div>
)

const Row = memo(RowBase)

export const Grid = ({
  columns,
  footer,
  onEndReached,
  onReorder,
  renderBody,
  renderCell,
  renderHeader,
  rows,
  scrollRef,
  scrollToRef,
}: {
  columns: GridColumn[]
  footer?: ReactNode
  onEndReached?: () => void
  onReorder?: (ids: string[]) => void
  /** Wraps the rows container, e.g. to make it one context-menu trigger. */
  renderBody: (body: ReactNode) => ReactNode
  renderCell: (props: GridCellProps) => ReactNode
  renderHeader: (props: GridHeaderProps) => ReactNode
  rows: GridRow[]
  scrollRef: RefObject<HTMLDivElement | null>
  scrollToRef?: Ref<ScrollToCell>
}) => {
  const { dragging, handlers, setWidth } = useColumnDrag({
    columns,
    onReorder,
    scrollRef,
  })

  const pinned = pinnedCount(columns)
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
    paddingEnd: GUTTER,
    paddingStart: GUTTER,
    // Reads `columns`, not `pinned`: closing over `pinned` makes the compiler drop this options object's memo, and a new extractor every render hands every memoized row a new `virtualColumns`.
    rangeExtractor: (range: Range) =>
      [
        ...new Set([
          ...Array.from({ length: pinnedCount(columns) }, (_, index) => index),
          ...defaultRangeExtractor(range),
        ]),
      ].toSorted((a, b) => a - b),
  })
  const virtualRows = rowVirtualizer.virtualItems
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

  useEndReached({
    count: rows.length,
    lastIndex: virtualRows.at(-1)?.index ?? 0,
    onEndReached,
    threshold: END_REACHED_ROWS,
  })

  const header = (
    <div
      role="row"
      aria-rowindex={1}
      className={`bg-background after:border-border sticky top-0 z-20 flex w-full after:absolute after:inset-x-0 after:bottom-0 after:z-20 after:border-b ${COLUMN_RULES}`}
    >
      {renderColumns(columns, virtualColumns, (column, index) => (
        <Header
          column={column}
          columns={columns}
          handlers={handlers}
          index={index}
          isDragging={dragging === column.id}
          renderHeader={renderHeader}
          setWidth={setWidth}
        />
      ))}
    </div>
  )

  return (
    <ScrollArea
      ref={scrollRef}
      role="grid"
      tabIndex={0}
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      className="group/grid table-scroller relative isolate size-full scroll-pl-(--grid-pinned) outline-none"
      style={
        {
          '--grid-pinned': `${pinned > 0 ? GUTTER + columns.slice(0, pinned).reduce((total, column) => total + column.size, 0) : 0}px`,
          '--grid-row-height': `${DEFAULT_ROW_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <div
        style={
          {
            '--grid-width': `${columnVirtualizer.totalSize}px`,
          } as CSSProperties
        }
        className="w-(--grid-width) min-w-full"
      >
        {header}
        {renderBody(
          <div
            role="rowgroup"
            className="relative h-(--grid-height) pt-(--grid-top) contain-layout"
            style={
              {
                '--grid-height': `${rowVirtualizer.totalSize}px`,
                '--grid-top': `${virtualRows[0]?.start ?? 0}px`,
              } as CSSProperties
            }
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                row && (
                  <Row
                    key={virtualRow.key}
                    columns={columns}
                    dragging={dragging}
                    renderCell={renderCell}
                    row={row}
                    rowIndex={virtualRow.index}
                    virtualColumns={virtualColumns}
                  />
                )
              )
            })}
          </div>
        )}
        {footer}
      </div>
    </ScrollArea>
  )
}
