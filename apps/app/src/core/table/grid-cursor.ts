import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { GridRow } from '@tamery/table'
import type { RefObject } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  createTransformer,
  parseCellText,
} from '~/core/transformers/create-transformer'
import { isNested } from '~/core/transformers/value-transformer'
import { posthog } from '~/lib/posthog'
import { plural } from '~/utils/plural'

import type { Column } from './cell/utils'
import { gridClipboard } from './clipboard'
import type {
  CellPosition,
  DataGridCell,
  DataGridLayout,
  GridCursor,
} from './cursor'
import { createCursorStore, rangeOf } from './cursor'
import { useFollowRows } from './follow-rows'
import { glideIntoView } from './glide-into-view'

export const useGridCursor = ({
  canEdit,
  columns,
  connectionType,
  getValue,
  layout,
  onEdit,
  onPreview,
  rowKey,
  rows,
  scrollRef,
}: {
  canEdit: (column: Column, rowIndex: number) => boolean
  columns: Column[]
  connectionType: ConnectionType
  getValue: (cell: DataGridCell) => unknown
  layout: DataGridLayout
  onEdit?: (cell: DataGridCell, value: unknown) => void
  onPreview?: (cell: DataGridCell, anchor: Element) => void
  rowKey?: (rowIndex: number) => string
  rows: GridRow[]
  scrollRef: RefObject<HTMLDivElement | null>
}) => {
  // oxlint-disable-next-line react/hook-use-state -- a stable store per mount, never replaced
  const [store] = useState(createCursorStore)
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
  const isEditable = (column: Column, rowIndex: number) =>
    !!onEdit && canEdit(column, rowIndex)
  const focusGrid = () => scrollRef.current?.focus({ preventScroll: true })

  const writeAll = (writes: [DataGridCell, string | null][]) => {
    let rejected = 0
    for (const [cell, text] of writes) {
      if (!isEditable(cell.column, cell.rowIndex)) {
        continue
      }
      const { data, error } = parseCellText(connectionType, cell.column, text)
      if (error) {
        rejected += 1
      } else {
        onEdit?.(cell, data)
      }
    }
    if (rejected > 0) {
      toast.error(
        `${plural(rejected, 'value')} did not fit ${rejected === 1 ? 'its column' : 'their columns'}`
      )
    }
  }

  const cursor: GridCursor = {
    apply: (value) => {
      const cell = current()
      if (cell && isEditable(cell.column, cell.rowIndex)) {
        onEdit?.(cell, value)
      }
    },
    canPeek: (cell) => layout === 'grid' && isNested(getValue(cell)),
    cancel: () => {
      store.set((state) => ({ ...state, edit: null }))
      focusGrid()
    },
    change: (text) => store.set((state) => ({ ...state, edit: { text } })),
    closePeek: () => store.set((state) => ({ ...state, peek: false })),
    commit: () => {
      const { edit } = store.get()
      const cell = current()
      if (!edit || !cell) {
        return true
      }
      if (isEditable(cell.column, cell.rowIndex)) {
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
          return false
        }
        onEdit?.(cell, data)
      }
      store.set((state) => ({ ...state, edit: null }))
      return true
    },
    connectionType,
    copy: () =>
      gridClipboard(cursor, { cellAt, columns, rows, writeAll }).copy(),
    current,
    dismiss: () =>
      store.set((state) =>
        state.anchor
          ? { ...state, anchor: null }
          : { anchor: null, cursor: null, edit: null, peek: false }
      ),
    edit: (text) => {
      const cell = current()
      if (
        !cell ||
        store.get().edit ||
        (text !== undefined && !isEditable(cell.column, cell.rowIndex))
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
      const others = cursor.selection().flat()
      if (!edit || !cursor.commit()) {
        return
      }
      const at = store.get().cursor
      writeAll(
        others
          .filter(
            (cell) => cell.rowIndex !== at?.row || cell.column.id !== at.column
          )
          .map((cell) => [cell, edit.text])
      )
      focusGrid()
    },
    fillDown: () => {
      const [top = [], ...below] = cursor.selection()
      posthog.capture('cells_filled_down', { rows: below.length })
      for (const row of below) {
        for (const [index, cell] of row.entries()) {
          const source = top[index]
          if (source && isEditable(cell.column, cell.rowIndex)) {
            onEdit?.(cell, getValue(source))
          }
        }
      }
    },
    getValue,
    indexOf,
    isEditable,
    layout,
    leave: (down, right) => {
      if (cursor.commit()) {
        cursor.step(down, right)
        focusGrid()
      }
    },
    paste: (text) =>
      gridClipboard(cursor, { cellAt, columns, rows, writeAll }).paste(text),
    place: (position, extend = false) => {
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
      requestAnimationFrame(() => {
        const scroller = scrollRef.current
        const element = cursor.element()
        if (scroller && element) {
          glideIntoView(scroller, element)
        }
      })
    },
    preview: () => {
      const cell = current()
      const element = cursor.element()
      if (!cell || !element) {
        return
      }
      if (cursor.canPeek(cell)) {
        store.set((state) => ({ ...state, peek: !state.peek }))
        return
      }
      onPreview?.(cell, element)
    },
    selection: () => {
      const range = rangeOf(store.get(), indexOf)
      if (!range) {
        const cell = current()
        return cell ? [[cell]] : []
      }
      const picked = columns.slice(range.left, range.right + 1)
      return rows.slice(range.top, range.bottom + 1).map((row, offset) =>
        picked.map((column) => ({
          column,
          row,
          rowIndex: range.top + offset,
        }))
      )
    },
    set: (value) => {
      cursor.apply(value)
      cursor.cancel()
    },
    step: (down, right, extend = false) => {
      const [rowStep, columnStep] =
        layout === 'documents' ? [right, down] : [down, right]
      const position = store.get().cursor
      const index = indexOf(position?.column ?? '')
      const column =
        columns[Math.min(Math.max(index + columnStep, 0), columns.length - 1)]
      if (!column || rows.length === 0) {
        return false
      }
      const row = Math.min(
        Math.max((position?.row ?? -1) + rowStep, 0),
        rows.length - 1
      )
      cursor.place({ column: column.id, row }, extend)
      return position?.row !== row || position.column !== column.id
    },
    store,
  }

  useFollowRows({ rowKey, rows, store })

  return cursor
}
