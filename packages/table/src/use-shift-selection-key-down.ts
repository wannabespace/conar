import type { KeyboardEvent } from 'react'
import type { ShiftSelectionDirection, ShiftSelectionState } from './shift-selection-state'
import { useCallback } from 'react'
import { reduceShiftArrowKey } from './shift-selection-state'

export interface UseShiftSelectionKeyDownOptions<TItem> {
  rowCount: number
  getItemsInRange: (startIndex: number, endIndex: number) => TItem[]
  getSelectionState: () => ShiftSelectionState
  onSelectionChange: (selected: TItem[], state: ShiftSelectionState) => void
}

const ARROW_KEY_TO_DIRECTION: Record<string, ShiftSelectionDirection> = {
  ArrowDown: 'down',
  ArrowUp: 'up',
}

export function useShiftSelectionKeyDown<TItem, TElement extends HTMLElement = HTMLDivElement>({
  rowCount,
  getItemsInRange,
  getSelectionState,
  onSelectionChange,
}: UseShiftSelectionKeyDownOptions<TItem>) {
  return useCallback((event: KeyboardEvent<TElement>) => {
    if (!event.shiftKey || rowCount === 0)
      return

    const direction = ARROW_KEY_TO_DIRECTION[event.key]

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

    const items = getItemsInRange(action.range.start, action.range.end)

    onSelectionChange(items, action.state)
  }, [rowCount, getItemsInRange, getSelectionState, onSelectionChange])
}
