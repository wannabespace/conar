import type { KeyboardEvent, MouseEvent } from 'react'
import type { SelectionState } from './use-shift-selection-key-down'
import { useRef } from 'react'

export interface UseShiftSelectionClickOptions {
  // Example: { id: string, type: string }
  rowKey: Record<string, string>
  rowIndex: number
  currentSelected: Record<string, string>[]
  lastClickedIndex: number | null
  getRangeKeys: (startIndex: number, endIndex: number) => Record<string, string>[]
  onSelectionChange: (
    selected: Record<string, string>[],
    selectionState: SelectionState,
    lastClickedIndex: number,
  ) => void
}

export function useShiftSelectionClick({
  rowKey,
  rowIndex,
  currentSelected,
  lastClickedIndex,
  getRangeKeys,
  onSelectionChange,
}: UseShiftSelectionClickOptions) {
  const shiftKeyRef = useRef(false)

  const isSelected = currentSelected.some(row =>
    Object.keys(rowKey).every(key => row[key] === rowKey[key]),
  )

  const handleMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    shiftKeyRef.current = event.shiftKey
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      shiftKeyRef.current = event.shiftKey
    }
  }

  const handleChange = () => {
    const isShiftHeld = shiftKeyRef.current

    if (isShiftHeld && lastClickedIndex !== null && lastClickedIndex !== rowIndex) {
      const start = Math.min(lastClickedIndex, rowIndex)
      const end = Math.max(lastClickedIndex, rowIndex)
      const rangeKeys = getRangeKeys(start, end)

      onSelectionChange(rangeKeys, {
        anchorIndex: lastClickedIndex,
        focusIndex: rowIndex,
        lastExpandDirection: rowIndex > lastClickedIndex ? 'down' : 'up',
      }, rowIndex)
    }
    else {
      if (isSelected) {
        const newSelected = currentSelected.filter(row =>
          !Object.keys(rowKey).every(key => row[key] === rowKey[key]),
        )
        onSelectionChange(
          newSelected,
          { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
          rowIndex,
        )
      }
      else {
        onSelectionChange(
          [...currentSelected, rowKey],
          { anchorIndex: rowIndex, focusIndex: rowIndex, lastExpandDirection: null },
          rowIndex,
        )
      }
    }

    shiftKeyRef.current = false
  }

  return {
    handleMouseDown,
    handleKeyDown,
    handleChange,
  }
}
