import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export interface UseShiftSelectionKeyDownOptions {
  rowCount: number
  getRowKey: (index: number) => Record<string, string>
  getRangeKeys: (startIndex: number, endIndex: number) => Record<string, string>[]
  getSelectionState: () => SelectionState
  onSelectionChange: (selected: Record<string, string>[], selectionState: SelectionState) => void
}

export function useShiftSelectionKeyDown({
  rowCount,
  getRowKey,
  getRangeKeys,
  getSelectionState,
  onSelectionChange,
}: UseShiftSelectionKeyDownOptions) {
  return useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.shiftKey || rowCount === 0)
      return

    const isArrowDown = event.key === 'ArrowDown'
    const isArrowUp = event.key === 'ArrowUp'

    if (!isArrowDown && !isArrowUp)
      return

    event.preventDefault()

    const { anchorIndex, focusIndex } = getSelectionState()
    const currentDirection = isArrowDown ? 'down' : 'up'

    if (anchorIndex === null || focusIndex === null) {
      const startIndex = isArrowDown ? 0 : rowCount - 1
      const rowKeys = getRowKey(startIndex)

      onSelectionChange([rowKeys], {
        anchorIndex: startIndex,
        focusIndex: startIndex,
        lastExpandDirection: null,
      })
      return
    }

    const newFocusIndex = isArrowDown
      ? Math.min(focusIndex + 1, rowCount - 1)
      : Math.max(focusIndex - 1, 0)

    const atBoundary = newFocusIndex === focusIndex

    if (anchorIndex === focusIndex) {
      if (atBoundary)
        return

      const start = Math.min(anchorIndex, newFocusIndex)
      const end = Math.max(anchorIndex, newFocusIndex)
      const rangeKeys = getRangeKeys(start, end)

      onSelectionChange(rangeKeys, {
        anchorIndex,
        focusIndex: newFocusIndex,
        lastExpandDirection: currentDirection,
      })
      return
    }

    if (atBoundary)
      return

    const wasExpandedDown = focusIndex > anchorIndex
    const wasExpandedUp = focusIndex < anchorIndex
    const isShrinking = (wasExpandedDown && isArrowUp) || (wasExpandedUp && isArrowDown)
    const { lastExpandDirection } = getSelectionState()

    const updatedSelectionState: SelectionState = {
      anchorIndex,
      focusIndex: newFocusIndex,
      lastExpandDirection: isShrinking ? lastExpandDirection : currentDirection,
    }

    const start = Math.min(anchorIndex, newFocusIndex)
    const end = Math.max(anchorIndex, newFocusIndex)
    const rangeKeys = getRangeKeys(start, end)

    onSelectionChange(rangeKeys, updatedSelectionState)
  }, [rowCount, getRowKey, getRangeKeys, getSelectionState, onSelectionChange])
}
