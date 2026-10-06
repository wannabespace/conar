import type { GridRow } from '@tamery/table'
import { createStore } from 'seitu'

import type { Column } from './utils'

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
export const rangeOf = (
  { anchor, cursor }: SelectionEnds,
  indexOf: (column: string) => number
) => {
  if (
    !anchor ||
    !cursor ||
    (anchor.row === cursor.row && anchor.column === cursor.column)
  ) {
    return null
  }
  const [from, to] = [indexOf(anchor.column), indexOf(cursor.column)]
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
  indexOf: (column: string) => number
) => {
  const range = rangeOf(selection, indexOf)
  const column = indexOf(position.column)
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
