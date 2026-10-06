import { createContext, use } from 'react'
import { useSubscription } from 'seitu/react'

import type { CellPosition, CursorStore, DataGridLayout } from './cell/cursor'
import { inRange, rangeOf } from './cell/cursor'
import type { GridCursor } from './grid-cursor'

export const CursorContext = createContext<{
  cursor: GridCursor
  indexOf: (column: string) => number
  layout: DataGridLayout
  store: CursorStore
} | null>(null)

export const useCellCursor = (position: CellPosition) => {
  const context = use(CursorContext)
  if (!context) {
    throw new Error('Cells must be rendered within a DataGrid')
  }
  const state = useSubscription(context.store, {
    selector: ({ anchor, cursor, edit, peek }) => {
      if (cursor?.row === position.row && cursor.column === position.column) {
        if (edit) {
          return 'editing'
        }
        if (peek) {
          return 'peek'
        }
        return rangeOf({ anchor, cursor }, context.indexOf)
          ? 'range-cursor'
          : 'cursor'
      }
      return inRange({ anchor, cursor }, position, context.indexOf)
        ? 'range'
        : null
    },
  })
  return { ...context, state }
}
