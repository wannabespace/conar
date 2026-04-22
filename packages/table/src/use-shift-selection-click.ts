import type { KeyboardEvent, MouseEvent } from 'react'
import type { ShiftSelectionState } from './shift-selection-state'
import { useRef } from 'react'

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

const SELECTION_KEYS = new Set([' ', 'Enter'])

function shallowEqualByLeftKeys<TItem>(a: TItem, b: TItem): boolean {
  if (Object.is(a, b))
    return true

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null)
    return false

  const aRecord = a as Record<string, unknown>
  const bRecord = b as Record<string, unknown>
  const aKeys = Object.keys(aRecord)

  if (aKeys.length === 0)
    return Object.keys(bRecord).length === 0

  return aKeys.every(key => aRecord[key] === bRecord[key])
}

export function useShiftSelectionClick<TItem>({
  rowKey,
  rowIndex,
  currentSelected,
  lastClickedIndex,
  getItemsInRange,
  isEqual = shallowEqualByLeftKeys,
  onSelectionChange,
}: UseShiftSelectionClickOptions<TItem>) {
  const shiftKeyRef = useRef(false)

  const matchesRow = (row: TItem) => isEqual(rowKey, row)
  const isSelected = currentSelected.some(matchesRow)

  const handleMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    shiftKeyRef.current = event.shiftKey
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (SELECTION_KEYS.has(event.key))
      shiftKeyRef.current = event.shiftKey
  }

  const selectRangeTo = (targetIndex: number, anchorIndex: number) => {
    const start = Math.min(anchorIndex, targetIndex)
    const end = Math.max(anchorIndex, targetIndex)

    onSelectionChange(getItemsInRange(start, end), {
      anchorIndex,
      focusIndex: targetIndex,
      lastExpandDirection: targetIndex > anchorIndex ? 'down' : 'up',
    }, targetIndex)
  }

  const deselectRow = () => {
    onSelectionChange(
      currentSelected.filter(row => !matchesRow(row)),
      { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
      rowIndex,
    )
  }

  const selectRow = () => {
    onSelectionChange(
      [...currentSelected, rowKey],
      { anchorIndex: rowIndex, focusIndex: rowIndex, lastExpandDirection: null },
      rowIndex,
    )
  }

  const handleChange = () => {
    const isShiftHeld = shiftKeyRef.current
    shiftKeyRef.current = false

    if (isShiftHeld && lastClickedIndex !== null && lastClickedIndex !== rowIndex) {
      selectRangeTo(rowIndex, lastClickedIndex)
      return
    }

    if (isSelected) {
      deselectRow()
      return
    }

    selectRow()
  }

  return {
    isSelected,
    handleMouseDown,
    handleKeyDown,
    handleChange,
  }
}
