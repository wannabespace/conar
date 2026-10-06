import type { GridRow } from '@tamery/table'
import { useLayoutEffect, useRef } from 'react'

import type { CellPosition, CursorStore } from './cursor'

/** Rows inserted, saved or refetched above the cursor move it with its row; once its row is gone the cursor and its edit end. */
export const useFollowRows = ({
  rowKey,
  rows,
  store,
}: {
  rowKey?: (rowIndex: number) => string
  rows: GridRow[]
  store: CursorStore
}) => {
  const before = useRef({ rowKey, rows })
  useLayoutEffect(() => {
    const { rowKey: keyBefore, rows: rowsBefore } = before.current
    before.current = { rowKey, rows }
    const { anchor, cursor } = store.get()
    if (!cursor || !rowKey || !keyBefore || rowsBefore === rows) {
      return
    }
    const follow = (position: CellPosition) => {
      const key = keyBefore(position.row)
      if (rowKey(position.row) === key) {
        return position
      }
      const row = rows.findIndex((_, index) => rowKey(index) === key)
      return row === -1 ? null : { ...position, row }
    }
    const next = follow(cursor)
    const nextAnchor = anchor && follow(anchor)
    if (next === cursor && nextAnchor === anchor) {
      return
    }
    store.set((state) =>
      next
        ? { ...state, anchor: nextAnchor, cursor: next }
        : { anchor: null, cursor: null, edit: null, peek: false }
    )
  })
}
