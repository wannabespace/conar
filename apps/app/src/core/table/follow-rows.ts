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
    const previous = before.current
    before.current = { rowKey, rows }
    if (!rowKey || !previous.rowKey || previous.rows === rows) {
      return
    }
    const { anchor, cursor } = store.get()
    const keyAt = (position: CellPosition | null) =>
      position && position.row < previous.rows.length
        ? previous.rowKey?.(position.row)
        : undefined
    const [anchorKey, cursorKey] = [keyAt(anchor), keyAt(cursor)]
    const stays = (position: CellPosition | null, key?: string) =>
      !position || (position.row < rows.length && rowKey(position.row) === key)
    if (stays(anchor, anchorKey) && stays(cursor, cursorKey)) {
      return
    }
    const indexByKey = new Map(rows.map((_, index) => [rowKey(index), index]))
    const follow = (position: CellPosition | null, key?: string) => {
      const row = key === undefined ? undefined : indexByKey.get(key)
      return position && row !== undefined ? { ...position, row } : null
    }
    const next = follow(cursor, cursorKey)
    store.set((state) =>
      next
        ? { ...state, anchor: follow(anchor, anchorKey), cursor: next }
        : { anchor: null, cursor: null, edit: null, peek: false }
    )
  })
}
