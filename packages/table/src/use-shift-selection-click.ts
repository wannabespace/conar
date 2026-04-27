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
  isEqual?: (a: TItem, b: TItem) => boolean
  onSelectionChange: (
    selected: TItem[],
    state: ShiftSelectionState,
    lastClickedIndex: number,
  ) => void
}

function defaultIsEqual<TItem>(a: TItem, b: TItem): boolean {
  if (Object.is(a, b))
    return true

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null)
    return false

  return Object.keys(a).every(k =>
    (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k],
  )
}

export function useShiftSelectionClick<TItem>({
  rowKey,
  rowIndex,
  currentSelected,
  lastClickedIndex,
  getItemsInRange,
  isEqual = defaultIsEqual,
  onSelectionChange,
}: UseShiftSelectionClickOptions<TItem>) {
  const shiftKeyRef = useRef(false)

  const isSelected = currentSelected.some(row => isEqual(rowKey, row))

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
      onSelectionChange(
        currentSelected.filter(row => !isEqual(rowKey, row)),
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
