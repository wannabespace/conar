import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { GridRow } from '@tamery/table'
import type { RefObject } from 'react'

import {
  createTransformer,
  parseCellText,
} from '~/core/transformers/create-transformer'

import type {
  CellPosition,
  CursorStore,
  DataGridCell,
  DataGridLayout,
} from './cell/cursor'
import { rangeOf } from './cell/cursor'
import { isNested } from './cell/json-tree'
import type { Column } from './cell/utils'
import { gridClipboard } from './clipboard'

export const useGridCursor = ({
  columns,
  connectionType,
  getValue,
  layout,
  onEdit,
  onPreview,
  rows,
  scrollRef,
  store,
}: {
  columns: Column[]
  connectionType: ConnectionType
  getValue: (cell: DataGridCell) => unknown
  layout: DataGridLayout
  onEdit?: (cell: DataGridCell, value: unknown) => void
  onPreview?: (cell: DataGridCell, anchor: Element) => void
  rows: GridRow[]
  scrollRef: RefObject<HTMLDivElement | null>
  store: CursorStore
}) => {
  // The compiler skips a hook that calls no hooks; unmemoized, `cursor` is a new CursorContext value each render and re-renders every cell.
  'use memo'

  const byId = new Map(columns.map((column) => [column.id, column]))
  const columnIndex = new Map(
    columns.map((column, index) => [column.id, index])
  )
  const indexOf = (column: string) => columnIndex.get(column) ?? -1

  const cellAt = (position: CellPosition | null): DataGridCell | null => {
    const column = position && byId.get(position.column)
    const row = position && rows[position.row]
    return column && row ? { column, row, rowIndex: position.row } : null
  }
  const current = () => cellAt(store.get().cursor)
  const isEditable = (column: Column) => !!onEdit && column.isEditable !== false
  const focusGrid = () => scrollRef.current?.focus({ preventScroll: true })
  const selection = (): DataGridCell[][] => {
    const range = rangeOf(store.get(), indexOf)
    if (!range) {
      const cell = current()
      return cell ? [[cell]] : []
    }
    const picked = columns.slice(range.left, range.right + 1)
    return rows
      .slice(range.top, range.bottom + 1)
      .map((row, offset) =>
        picked.map((column) => ({ column, row, rowIndex: range.top + offset }))
      )
  }

  const clipboard = gridClipboard({
    cellAt,
    columns,
    connectionType,
    getValue,
    indexOf,
    isEditable,
    onEdit,
    rows,
    selection,
    store,
  })

  const cursor = {
    apply: (value: unknown) => {
      const cell = current()
      if (cell && isEditable(cell.column)) {
        onEdit?.(cell, value)
      }
    },
    cancel: () => {
      store.set((state) => ({ ...state, edit: null }))
      focusGrid()
    },
    change: (text: string | null) =>
      store.set((state) => ({ ...state, edit: { text } })),
    clear: () =>
      store.set({ anchor: null, cursor: null, edit: null, peek: false }),
    /** Applies the open edit; `false` keeps it open with the reason the value was rejected. */
    commit: () => {
      const { edit } = store.get()
      const cell = current()
      if (!edit || !cell) {
        return true
      }
      if (isEditable(cell.column)) {
        const { data, error } = parseCellText(
          connectionType,
          cell.column,
          edit.text
        )
        if (error) {
          store.set((state) => ({
            ...state,
            edit: { ...edit, error: error.message },
          }))
          // The field is portaled out of the cell, so it is found by its popup's marker.
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLElement>('[data-editing] :is(textarea, input)')
              ?.focus()
          )
          return false
        }
        onEdit?.(cell, data)
      }
      store.set((state) => ({ ...state, edit: null }))
      return true
    },
    copy: () => clipboard.copy(),
    /** `text` types over the cell; without it the edit starts from the current value. */
    edit: (text?: string) => {
      const cell = current()
      if (
        !cell ||
        store.get().edit ||
        (text !== undefined && !isEditable(cell.column))
      ) {
        return
      }
      const value = getValue(cell)
      if (cell.column.uiType === 'boolean') {
        if (text === undefined) {
          cursor.apply(
            value === null ||
              !createTransformer(connectionType, cell.column)
                .fromConnection(value)
                .toUI()
          )
        } else if (text === '' && cell.column.isNullable) {
          cursor.apply(null)
        }
        return
      }
      store.set((state) => ({
        ...state,
        edit: {
          text:
            text ??
            (value === null
              ? null
              : createTransformer(connectionType, cell.column)
                  .fromConnection(value)
                  .toRaw()),
        },
        peek: false,
      }))
    },
    element: () => scrollRef.current?.querySelector('[data-cell][data-cursor]'),
    fill: () => {
      const { edit } = store.get()
      const others = selection().flat()
      if (!edit || !cursor.commit()) {
        return
      }
      const at = store.get().cursor
      clipboard.writeAll(
        others
          .filter(
            (cell) => cell.rowIndex !== at?.row || cell.column.id !== at.column
          )
          .map((cell) => [cell, edit.text])
      )
      focusGrid()
    },
    fillDown: () => {
      const [top = [], ...below] = selection()
      for (const row of below) {
        for (const [index, cell] of row.entries()) {
          const source = top[index]
          if (source && isEditable(cell.column)) {
            onEdit?.(cell, getValue(source))
          }
        }
      }
    },
    isEditable,
    leave: (down: number, right: number) => {
      if (cursor.commit()) {
        cursor.step(down, right)
        focusGrid()
      }
    },
    paste: (text: string) => {
      const typed = clipboard.paste(text)
      if (typed !== undefined) {
        cursor.edit(typed)
        cursor.commit()
      }
    },
    place: (position: CellPosition, extend = false) => {
      const { cursor: at, edit } = store.get()
      if (
        (edit && at?.row === position.row && at.column === position.column) ||
        !cursor.commit()
      ) {
        return
      }
      store.set((state) => ({
        ...state,
        anchor: extend ? (state.anchor ?? state.cursor) : null,
        cursor: position,
        peek: false,
      }))
      // The cursor cell renders after the store update; scrolling here, not on cell mount, keeps virtualized remounts from yanking the scroll back.
      requestAnimationFrame(() =>
        cursor
          .element()
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      )
    },
    preview: () => {
      const cell = current()
      const element = cursor.element()
      if (!cell || !element) {
        return
      }
      if (layout === 'grid' && isNested(getValue(cell))) {
        store.set((state) => ({ ...state, peek: !state.peek }))
        return
      }
      onPreview?.(cell, element)
    },
    selection,
    step: (down: number, right: number, extend = false) => {
      const [rowStep, columnStep] =
        layout === 'documents' ? [right, down] : [down, right]
      const position = store.get().cursor
      const index = indexOf(position?.column ?? '')
      const column =
        columns[Math.min(Math.max(index + columnStep, 0), columns.length - 1)]
      if (column) {
        cursor.place(
          {
            column: column.id,
            row: Math.min(
              Math.max((position?.row ?? -1) + rowStep, 0),
              rows.length - 1
            ),
          },
          extend
        )
      }
    },
  }

  return { byId, cellAt, cursor, indexOf }
}

export type GridCursor = ReturnType<typeof useGridCursor>['cursor']
