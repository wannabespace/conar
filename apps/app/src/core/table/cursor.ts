import type { SqlDialect } from '@tamery/shared/enums/connection-type'
import type { GridRow } from '@tamery/table'
import { createContext, use } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'

import type { Column } from './cell/utils'

export interface CellPosition {
  column: string
  row: number
}

export interface CellEdit {
  error?: string
  /** `null` is the NULL value, distinct from an empty string. */
  text: string | null
}

interface CursorState {
  /** The corner a Shift-extended selection grows from; `null` selects the cursor cell alone. */
  anchor: CellPosition | null
  cursor: CellPosition | null
  /** Its text lives here, not in the field, so an edit survives its row scrolling out and back. */
  edit: CellEdit | null
  peek: boolean
}

export const createCursorStore = () =>
  createStore<CursorState>({
    anchor: null,
    cursor: null,
    edit: null,
    peek: false,
  })

type SelectionEnds = Pick<CursorState, 'anchor' | 'cursor'>

/** Inclusive bounds by row and column index; `null` for a single cell. */
export const getRange = (
  { anchor, cursor }: SelectionEnds,
  getIndex: (column: string) => number
) => {
  if (
    !anchor ||
    !cursor ||
    (anchor.row === cursor.row && anchor.column === cursor.column)
  ) {
    return null
  }
  const [from, to] = [getIndex(anchor.column), getIndex(cursor.column)]
  return {
    bottom: Math.max(anchor.row, cursor.row),
    left: Math.min(from, to),
    right: Math.max(from, to),
    top: Math.min(anchor.row, cursor.row),
  }
}

export const inRange = (
  selection: SelectionEnds,
  position: CellPosition,
  getIndex: (column: string) => number
) => {
  const range = getRange(selection, getIndex)
  const column = getIndex(position.column)
  return (
    !!range &&
    position.row >= range.top &&
    position.row <= range.bottom &&
    column >= range.left &&
    column <= range.right
  )
}

export type CursorStore = ReturnType<typeof createCursorStore>

export type DataGridLayout = 'grid' | 'documents'

export interface DataGridCell {
  column: Column
  row: GridRow
  rowIndex: number
}

export interface GridCursor {
  apply: (value: unknown) => void
  cancel: () => void
  canPeek: (cell: DataGridCell) => boolean
  change: (text: string | null) => void
  closePeek: () => void
  collapse: () => void
  /** Applies the open edit; `false` keeps it open with the reason the value was rejected. */
  commit: () => boolean
  dialect: SqlDialect
  copy: () => void
  current: () => DataGridCell | null
  /** `text` types over the cell; without it the edit starts from the current value. */
  edit: (text?: string) => void
  element: () => Element | null | undefined
  fill: () => void
  fillDown: () => void
  getValue: (cell: DataGridCell) => unknown
  getIndex: (column: string) => number
  isEditable: (column: Column, rowIndex: number) => boolean
  layout: DataGridLayout
  leave: (down: number, right: number) => void
  paste: (text: string) => void
  place: (position: CellPosition, extend?: boolean) => void
  preview: () => void
  selection: () => DataGridCell[][]
  set: (value: unknown) => void
  step: (down: number, right: number, extend?: boolean) => void
  store: CursorStore
}

export const CursorContext = createContext<GridCursor | null>(null)

export const useGridCursorContext = () => {
  const cursor = use(CursorContext)
  if (!cursor) {
    throw new Error('Cells must be rendered within a DataGrid')
  }
  return cursor
}

export const useCellCursor = (position: CellPosition) => {
  const cursor = useGridCursorContext()
  const state = useSubscription(cursor.store, {
    selector: ({ anchor, cursor: at, edit, peek }) => {
      if (at?.row === position.row && at.column === position.column) {
        if (edit) {
          return 'editing'
        }
        if (peek) {
          return 'peek'
        }
        return getRange({ anchor, cursor: at }, cursor.getIndex)
          ? 'range-cursor'
          : 'cursor'
      }
      return inRange({ anchor, cursor: at }, position, cursor.getIndex)
        ? 'range'
        : null
    },
  })
  return { cursor, state }
}
