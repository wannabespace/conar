/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type {
  GridCellProps,
  GridColumn,
  GridHeaderProps,
  GridRow,
  GridScrollerProps,
  ScrollToCell,
} from '@tamery/table'
import { Grid } from '@tamery/table'
import type { CSSProperties, ReactNode, Ref, RefObject } from 'react'
import { useImperativeHandle, useLayoutEffect, useRef } from 'react'

import { AppContextMenu } from '~/components/app-context-menu'

import type { CellGeometry } from './cell/cell'
import { TableCell } from './cell/cell'
import type { CellMenuExtra } from './cell/cell-menu'
import { cellMenu } from './cell/cell-menu'
import type { Column } from './cell/utils'
import type { DataGridCell, DataGridLayout } from './cursor'
import { CursorContext } from './cursor'
import { DocumentList } from './document-list'
import type { GridBarItem } from './grid-bar'
import { GridBar } from './grid-bar'
import { useGridCursor } from './grid-cursor'
import { useGridHotkeys, useGridPointer } from './grid-input'

export interface DataGridHandle {
  /** Applies the open edit; `false` keeps it open with the reason the value was rejected. */
  commit: () => boolean
  /** Scrolls a cell into view, even one virtualized away, puts the cursor on it and focuses the grid; `row` is a `rowKey`, so a row staged in the same tick is found once it renders. */
  reveal: (target: { column: string; row: string }) => void
}

/** A column outside the data (row selection, trailing actions) that never moves. */
export interface ExtraColumn {
  id: string
  renderCell: (props: {
    row: GridRow
    rowIndex: number
    style?: CSSProperties
  }) => ReactNode
  renderHeader: (props: GridHeaderProps) => ReactNode
  size: number
}

const valueOf = ({ column, row }: DataGridCell) => row[column.id]

const PlainHeader = (
  column: Column,
  { dragHandle, style }: GridHeaderProps
) => (
  <div
    role="columnheader"
    // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
    style={style}
    className="flex min-w-0 flex-col justify-center px-2 py-1.5 select-none"
    {...dragHandle}
  >
    <div data-mask className="truncate text-xs font-medium">
      {column.id}
    </div>
    {column.typeLabel && (
      <div className="text-muted-foreground text-2xs truncate leading-4">
        {column.typeLabel}
      </div>
    )}
  </div>
)

export const DataGrid = ({
  bar,
  columns,
  connectionType,
  cursorRef,
  footer,
  getValue = valueOf,
  isFetching,
  layout = 'grid',
  leading,
  menuItems,
  onEdit,
  onEndReached,
  onExtendRows,
  onPreview,
  onReorder,
  pinned,
  renderCell,
  renderHeader = PlainHeader,
  renderLabel,
  rowKey,
  rows,
  scrollRef: externalScrollRef,
  sizeOf,
  trailing,
}: {
  /** Actions floating over the grid's bottom edge, beside the cell-block summary. */
  bar?: GridBarItem[]
  columns: Column[]
  connectionType: ConnectionType
  cursorRef?: Ref<DataGridHandle>
  footer?: ReactNode
  /** The value the cell shows and the editor starts from, e.g. a pending draft. */
  getValue?: (cell: DataGridCell) => unknown
  isFetching?: boolean
  layout?: DataGridLayout
  leading?: ExtraColumn
  menuItems?: (
    cell: DataGridCell,
    element: Element | null | undefined
  ) => CellMenuExtra
  onEdit?: (cell: DataGridCell, value: unknown) => void
  onEndReached?: () => void
  /** Shift+↑/↓ while no cell has the cursor. */
  onExtendRows?: (direction: 'up' | 'down') => void
  /** Space on the cursor cell, like Quick Look; `anchor` is the cell element. */
  onPreview?: (cell: DataGridCell, anchor: Element) => void
  onReorder?: (ids: string[]) => void
  /** Columns stuck to the left edge; they must lead `columns`. */
  pinned?: string[]
  renderCell?: (cell: DataGridCell, props?: CellGeometry) => ReactNode
  renderHeader?: (column: Column, props: GridHeaderProps) => ReactNode
  /** A column's name beside each value in the documents layout. */
  renderLabel?: (column: Column) => ReactNode
  /** A row's identity across inserts and refetches; without it the cursor stays on its index. */
  rowKey?: (rowIndex: number) => string
  rows: GridRow[]
  scrollRef?: RefObject<HTMLDivElement | null>
  sizeOf: (column: Column) => number
  trailing?: ExtraColumn
}) => {
  const ownScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = externalScrollRef ?? ownScrollRef
  const { byId, cursor } = useGridCursor({
    columns,
    connectionType,
    getValue,
    layout,
    onEdit,
    onPreview,
    rowKey,
    rows,
    scrollRef,
  })
  useGridHotkeys({ canEdit: !!onEdit, cursor, onExtendRows, scrollRef })
  const pointer = useGridPointer(cursor)
  const extras = new Map(
    [leading, trailing].flatMap((extra) => (extra ? [[extra.id, extra]] : []))
  )
  const gridColumns: GridColumn[] = [
    ...(leading ? [{ id: leading.id, pinned: true, size: leading.size }] : []),
    ...columns.map((column) => ({
      id: column.id,
      pinned: !!pinned?.includes(column.id),
      size: sizeOf(column),
    })),
    ...(trailing
      ? [{ fixed: true, id: trailing.id, size: trailing.size }]
      : []),
  ]

  const scrollToCell = useRef<ScrollToCell>(null)
  const revealing = useRef<{ column: string; row: string } | null>(null)
  const reveal = () => {
    const target = revealing.current
    const row =
      target && rowKey
        ? rows.findIndex((_, index) => rowKey(index) === target.row)
        : -1
    if (!target || row === -1) {
      return
    }
    revealing.current = null
    scrollToCell.current?.(row, target.column)
    cursor.place({ column: target.column, row })
    scrollRef.current?.focus({ preventScroll: true })
  }
  useLayoutEffect(() => {
    reveal()
    revealing.current = null
  })
  useImperativeHandle(cursorRef, () => ({
    commit: cursor.commit,
    reveal: (target) => {
      revealing.current = target
      reveal()
    },
  }))

  const menu = () => {
    const cell = cursor.cellAt(cursor.store.get().cursor)
    if (!cell) {
      return []
    }
    const editable = cursor.isEditable(cell.column)
    return cellMenu({
      cells: cursor.selection().flat().length,
      columns: columns.map((column) => column.id),
      editable,
      extra: menuItems?.(cell, cursor.element()) ?? {},
      onCopy: cursor.copy,
      onFillDown:
        editable && cursor.selection().length > 1 ? cursor.fillDown : undefined,
      onOpen: () => cursor.edit(),
      onShowJson: cursor.canPeek(cell) ? cursor.preview : undefined,
      row: cell.row,
    })
  }

  const renderDataCell = (cell: DataGridCell, geometry?: CellGeometry) =>
    renderCell ? (
      renderCell(cell, geometry)
    ) : (
      <TableCell
        {...geometry}
        column={cell.column}
        connectionType={connectionType}
        rowIndex={cell.rowIndex}
        value={getValue(cell)}
      />
    )

  const renderGridCell = (props: GridCellProps) => {
    const column = byId.get(props.column.id)
    return column
      ? renderDataCell(
          { column, row: props.row, rowIndex: props.rowIndex },
          {
            isDragging: props.isDragging,
            pinned: props.column.pinned,
            size: props.column.size,
            style: props.style,
          }
        )
      : extras.get(props.column.id)?.renderCell(props)
  }

  const scroller: GridScrollerProps = {
    footer,
    isFetching,
    onEndReached,
    renderBody: (body) => (
      <AppContextMenu
        items={menu}
        render={
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the keyboard drives the cursor through the grid's hotkeys
          <div {...pointer} />
        }
      >
        {body}
      </AppContextMenu>
    ),
    scrollRef,
  }

  return (
    <CursorContext value={cursor}>
      {layout === 'documents' ? (
        <DocumentList
          {...scroller}
          scrollToRef={scrollToCell}
          rows={rows}
          columns={columns}
          leading={leading?.renderCell}
          renderCell={renderDataCell}
          renderLabel={renderLabel}
        />
      ) : (
        <Grid
          {...scroller}
          scrollToRef={scrollToCell}
          rows={rows}
          columns={gridColumns}
          onReorder={onReorder}
          renderHeader={(props) => {
            const column = byId.get(props.column.id)
            return column
              ? renderHeader(column, props)
              : extras.get(props.column.id)?.renderHeader(props)
          }}
          renderCell={renderGridCell}
        />
      )}
      <GridBar cursor={cursor} items={bar} />
    </CursorContext>
  )
}
