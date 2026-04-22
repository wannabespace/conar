import type { KeyboardEvent } from 'react'
import type { ShiftSelectionState } from './shift-selection-state'
import { useCallback } from 'react'
import { reduceShiftArrowKey } from './shift-selection-state'

export interface UseShiftSelectionKeyDownOptions<TItem> {
  /** Total number of selectable rows currently visible. */
  rowCount: number
  /**
   * Returns the items inside the inclusive range `[startIndex, endIndex]`.
   * Called with `start === end` to resolve a single row.
   */
  getItemsInRange: (startIndex: number, endIndex: number) => TItem[]
  /** Read the current selection state from the caller's store. */
  getSelectionState: () => ShiftSelectionState
  /** Commit a new selection plus its accompanying selection state. */
  onSelectionChange: (selected: TItem[], state: ShiftSelectionState) => void
}

const ARROW_DIRECTIONS = {
  ArrowDown: 'down',
  ArrowUp: 'up',
} as const

/**
 * Keyboard handler for Shift+ArrowUp / Shift+ArrowDown range selection.
 *
 * The hook itself is intentionally thin — all non‑trivial logic lives in the
 * pure `reduceShiftArrowKey` reducer (see `./shift-selection-state`), which
 * makes the behaviour unit‑testable without a React renderer.
 *
 * Generic over the row shape `TItem` so it can be reused with arbitrary item
 * representations (primary‑key tuples, row objects, ids, …).
 */
export function useShiftSelectionKeyDown<TItem, TElement extends HTMLElement = HTMLDivElement>({
  rowCount,
  getItemsInRange,
  getSelectionState,
  onSelectionChange,
}: UseShiftSelectionKeyDownOptions<TItem>) {
  return useCallback((event: KeyboardEvent<TElement>) => {
    if (!event.shiftKey || rowCount === 0)
      return

    const direction = ARROW_DIRECTIONS[event.key as keyof typeof ARROW_DIRECTIONS]

    if (!direction)
      return

    event.preventDefault()

    const action = reduceShiftArrowKey({
      direction,
      rowCount,
      state: getSelectionState(),
    })

    if (action.type === 'noop')
      return

    onSelectionChange(getItemsInRange(action.range.start, action.range.end), action.state)
  }, [rowCount, getItemsInRange, getSelectionState, onSelectionChange])
}
