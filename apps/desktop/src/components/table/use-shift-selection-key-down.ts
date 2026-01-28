import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export interface UseShiftSelectionKeyDownOptions {
  rows: Record<string, unknown>[]
  rowKeyColumns: string[]
  getSelectionState: () => SelectionState
  onSelectionChange: (selected: Record<string, string>[], selectionState: SelectionState) => void
}

export function useShiftSelectionKeyDown({
  rows,
  rowKeyColumns,
  getSelectionState,
  onSelectionChange,
}: UseShiftSelectionKeyDownOptions) {
  return useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.shiftKey || rows.length === 0 || rowKeyColumns.length === 0)
      return

    const isArrowDown = event.key === 'ArrowDown'
    const isArrowUp = event.key === 'ArrowUp'

    if (!isArrowDown && !isArrowUp)
      return

    event.preventDefault()

    const { anchorIndex, focusIndex } = getSelectionState()
    const currentDirection = isArrowDown ? 'down' : 'up'

    if (anchorIndex === null || focusIndex === null) {
      const startIndex = isArrowDown ? 0 : rows.length - 1
      const rowKeys = rowKeyColumns.reduce<Record<string, string>>(
        (acc, key) => ({ ...acc, [key]: rows[startIndex]![key] as string }),
        {},
      )

      onSelectionChange([rowKeys], {
        anchorIndex: startIndex,
        focusIndex: startIndex,
        lastExpandDirection: null,
      })
      return
    }

    const newFocusIndex = isArrowDown
      ? Math.min(focusIndex + 1, rows.length - 1)
      : Math.max(focusIndex - 1, 0)

    const atBoundary = newFocusIndex === focusIndex

    if (anchorIndex === focusIndex) {
      if (atBoundary)
        return

      const start = Math.min(anchorIndex, newFocusIndex)
      const end = Math.max(anchorIndex, newFocusIndex)
      const rangeRows = rows.slice(start, end + 1)
      const rangeKeys = rangeRows.map(row =>
        rowKeyColumns.reduce<Record<string, string>>(
          (acc, key) => ({ ...acc, [key]: row[key] as string }),
          {},
        ),
      )

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

    const rangeRows = rows.slice(start, end + 1)
    const rangeKeys = rangeRows.map(row =>
      rowKeyColumns.reduce<Record<string, string>>(
        (acc, key) => ({ ...acc, [key]: row[key] as string }),
        {},
      ),
    )

    onSelectionChange(rangeKeys, updatedSelectionState)
  }, [rows, rowKeyColumns, getSelectionState, onSelectionChange])
}
