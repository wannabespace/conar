import type { KeyboardEvent, MouseEvent } from 'react'
import type { ShiftSelectionState } from './shift-selection-state'
import { useRef } from 'react'
import { INITIAL_SHIFT_SELECTION_STATE } from './shift-selection-state'

export interface UseShiftSelectionClickOptions<TItem> {
  rowKey: TItem
  rowIndex: number
  currentSelected: TItem[]
  lastClickedIndex: number | null
  getItemsInRange: (startIndex: number, endIndex: number) => TItem[]
  onSelectionChange: (
    selected: TItem[],
    state: ShiftSelectionState,
    lastClickedIndex: number,
  ) => void
}

export function useShiftSelectionClick<TItem extends Record<string, unknown>>({
  rowKey,
  rowIndex,
  currentSelected,
  lastClickedIndex,
  getItemsInRange,
  onSelectionChange,
}: UseShiftSelectionClickOptions<TItem>) {
  const shiftKeyRef = useRef(false)

  const isSelected = currentSelected.some(row =>
    Object.keys(rowKey).every(key => row[key] === rowKey[key]),
  )

  const handleMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    shiftKeyRef.current = event.shiftKey
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ' ' || event.key === 'Enter')
      shiftKeyRef.current = event.shiftKey
  }

  const handleChange = () => {
    const isShiftHeld = shiftKeyRef.current
    shiftKeyRef.current = false

    if (isShiftHeld && lastClickedIndex !== null && lastClickedIndex !== rowIndex) {
      const start = Math.min(lastClickedIndex, rowIndex)
      const end = Math.max(lastClickedIndex, rowIndex)

      onSelectionChange(getItemsInRange(start, end), {
        anchorIndex: lastClickedIndex,
        focusIndex: rowIndex,
        lastExpandDirection: rowIndex > lastClickedIndex ? 'down' : 'up',
      }, rowIndex)
      return
    }

    if (isSelected) {
      const newSelected = currentSelected.filter(row =>
        !Object.keys(rowKey).every(key => row[key] === rowKey[key]),
      )
      onSelectionChange(
        newSelected,
        INITIAL_SHIFT_SELECTION_STATE,
        rowIndex,
      )
      return
    }

    onSelectionChange(
      [...currentSelected, rowKey],
      { anchorIndex: rowIndex, focusIndex: rowIndex, lastExpandDirection: null },
      rowIndex,
    )
  }

  return { isSelected, handleMouseDown, handleKeyDown, handleChange }
}
