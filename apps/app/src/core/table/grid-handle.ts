import type { GridRow, ScrollToCell } from '@tamery/table'
import type { Ref, RefObject } from 'react'
import { useImperativeHandle, useLayoutEffect, useRef } from 'react'

import type { GridCursor } from './cursor'

interface RevealTarget {
  column: string
  row: string
}

export interface DataGridHandle {
  /** Applies the open edit; `false` keeps it open with the reason the value was rejected. */
  commit: () => boolean
  focus: () => void
  /** Scrolls a cell into view, even one virtualized away, puts the cursor on it and focuses the grid; `row` is a `rowKey`, so a row staged in the same tick is found once it renders. */
  reveal: (target: RevealTarget) => void
}

export const useGridHandle = ({
  cursor,
  cursorRef,
  rowKey,
  rows,
  scrollRef,
}: {
  cursor: GridCursor
  cursorRef?: Ref<DataGridHandle>
  rowKey?: (rowIndex: number) => string
  rows: GridRow[]
  scrollRef: RefObject<HTMLDivElement | null>
}) => {
  const scrollToCell = useRef<ScrollToCell>(null)
  const revealing = useRef<RevealTarget | null>(null)
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
    focus: () => scrollRef.current?.focus({ preventScroll: true }),
    reveal: (target) => {
      revealing.current = target
      reveal()
    },
  }))
  return scrollToCell
}
