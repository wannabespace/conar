/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type {
  GridCellProps,
  GridColumn,
  GridHeaderProps,
  GridRow,
  ScrollToCell,
} from '@tamery/table'
import { Grid } from '@tamery/table'
import type { ReactNode, Ref, RefObject } from 'react'
import { useImperativeHandle, useRef, useState } from 'react'

import { AppContextMenu } from '~/components/app-context-menu'

import { TableCell } from './cell/cell'
import type { CellMenuExtra } from './cell/cell-menu'
import { cellMenu } from './cell/cell-menu'
import type { CellPosition, DataGridCell, DataGridLayout } from './cell/cursor'
import { createCursorStore } from './cell/cursor'
import { isNested } from './cell/json-tree'
import type { Column } from './cell/utils'
import { CursorContext } from './cursor-context'
import { DocumentList } from './document-list'
import { useGridCursor } from './grid-cursor'
import { useGridHotkeys, useGridPointer } from './grid-input'
import { SelectionSummary } from './selection-summary'

export interface DataGridHandle {
  /** Whether arrow keys belong to the cell cursor, so Shift+arrows extend cells rather than rows. */
  hasCursor: () => boolean
  /** Scrolls a cell into view, even one virtualized away, puts the cursor on it and focuses the grid. */
  reveal: (position: CellPosition) => void
}

/** A column outside the data (row selection, trailing actions) that never moves. */
interface ExtraColumn {
  id: string
  renderCell: (props: GridCellProps) => ReactNode
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

const PlainLabel = (column: Column) => (
  <div data-mask className="truncate p-2 text-xs font-medium">
    {column.id}
  </div>
)

export const DataGrid = ({
  columns,
  connectionType,
  cursorRef,
  footer,
  getValue = valueOf,
  layout = 'grid',
  leading,
  menuItems,
  onEdit,
  onEndReached,
  onPreview,
  onReorder,
  pinned,
  renderCell,
  renderHeader = PlainHeader,
  renderLabel = PlainLabel,
  rows,
  scrollRef: externalScrollRef,
  sizeOf,
  trailing,
}: {
  columns: Column[]
  connectionType: ConnectionType
  cursorRef?: Ref<DataGridHandle>
  footer?: ReactNode
  /** The value the cell shows and the editor starts from, e.g. a pending draft. */
  getValue?: (cell: DataGridCell) => unknown
  layout?: DataGridLayout
  leading?: ExtraColumn
  menuItems?: (
    cell: DataGridCell,
    element: Element | null | undefined
  ) => CellMenuExtra
  onEdit?: (cell: DataGridCell, value: unknown) => void
  onEndReached?: () => void
  /** Space on the cursor cell, like Quick Look; `anchor` is the cell element. */
  onPreview?: (cell: DataGridCell, anchor: Element) => void
  onReorder?: (ids: string[]) => void
  /** Columns stuck to the left edge; they must lead `columns`. */
  pinned?: string[]
  renderCell?: (cell: DataGridCell, props: GridCellProps) => ReactNode
  renderHeader?: (column: Column, props: GridHeaderProps) => ReactNode
  /** A column's name beside each value in the documents layout. */
  renderLabel?: (column: Column) => ReactNode
  rows: GridRow[]
  scrollRef?: RefObject<HTMLDivElement | null>
  sizeOf: (column: Column) => number
  trailing?: ExtraColumn
}) => {
  const ownScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = externalScrollRef ?? ownScrollRef
  const [store, setStore] = useState(createCursorStore)
  void setStore
  const { byId, cellAt, cursor, indexOf } = useGridCursor({
    columns,
    connectionType,
    getValue,
    layout,
    onEdit,
    onPreview,
    rows,
    scrollRef,
    store,
  })
  useGridHotkeys({ canEdit: !!onEdit, cursor, scrollRef, store })
  const pointer = useGridPointer({ cursor, indexOf, store })
  const extras = new Map(
    [leading, trailing].flatMap((extra) => (extra ? [[extra.id, extra]] : []))
  )
  const gridColumns: GridColumn[] = [
    ...(leading
      ? [{ fixed: true, id: leading.id, pinned: true, size: leading.size }]
      : []),
    ...columns.map((column) => {
      const isPinned = !!pinned?.includes(column.id)
      return {
        fixed: isPinned,
        id: column.id,
        pinned: isPinned,
        size: sizeOf(column),
      }
    }),
    ...(trailing
      ? [{ fixed: true, id: trailing.id, size: trailing.size }]
      : []),
  ]

  const scrollToCell = useRef<ScrollToCell>(null)
  useImperativeHandle(cursorRef, () => ({
    hasCursor: () => store.get().cursor !== null,
    reveal: (position) => {
      scrollToCell.current?.(position.row, position.column)
      cursor.place(position)
      scrollRef.current?.focus({ preventScroll: true })
    },
  }))

  const menu = () => {
    const cell = cellAt(store.get().cursor)
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
      onShowJson:
        layout === 'grid' && isNested(getValue(cell))
          ? cursor.preview
          : undefined,
      row: cell.row,
    })
  }

  const renderGridCell = (props: GridCellProps) => {
    const column = byId.get(props.column.id)
    if (!column) {
      return extras.get(props.column.id)?.renderCell(props)
    }
    const cell = { column, row: props.row, rowIndex: props.rowIndex }
    return renderCell ? (
      renderCell(cell, props)
    ) : (
      <TableCell
        column={column}
        connectionType={connectionType}
        isDragging={props.isDragging}
        pinned={props.column.pinned}
        rowIndex={props.rowIndex}
        size={props.column.size}
        // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
        style={props.style}
        value={getValue(cell)}
      />
    )
  }

  const renderBody = (body: ReactNode) => (
    <AppContextMenu
      items={menu}
      render={
        // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the keyboard drives the cursor through the grid's hotkeys
        <div {...pointer} />
      }
    >
      {body}
    </AppContextMenu>
  )

  return (
    <CursorContext value={{ cursor, indexOf, layout, store }}>
      {layout === 'documents' ? (
        <DocumentList
          scrollRef={scrollRef}
          scrollToRef={scrollToCell}
          rows={rows}
          columns={columns}
          footer={footer}
          leading={leading?.renderCell}
          onEndReached={onEndReached}
          renderBody={renderBody}
          renderCell={renderGridCell}
          renderLabel={renderLabel}
        />
      ) : (
        <Grid
          scrollRef={scrollRef}
          scrollToRef={scrollToCell}
          rows={rows}
          columns={gridColumns}
          footer={footer}
          onEndReached={onEndReached}
          onReorder={onReorder}
          renderHeader={(props) => {
            const column = byId.get(props.column.id)
            return column
              ? renderHeader(column, props)
              : extras.get(props.column.id)?.renderHeader(props)
          }}
          renderCell={renderGridCell}
          renderBody={renderBody}
        />
      )}
      <SelectionSummary cursor={cursor} getValue={getValue} store={store} />
    </CursorContext>
  )
}
