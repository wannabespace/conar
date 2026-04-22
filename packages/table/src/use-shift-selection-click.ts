import type { KeyboardEvent, MouseEvent } from 'react'
import type { ShiftSelectionState } from './shift-selection-state'
import { useRef } from 'react'

export interface UseShiftSelectionClickOptions<TItem> {
  /** The row's identity (anything comparable via `isEqual`). */
  rowKey: TItem
  /** The row's index in the current listing. */
  rowIndex: number
  /** Currently selected items, as stored by the caller. */
  currentSelected: TItem[]
  /** Index of the row that was clicked last, used as the anchor for shift‑click. */
  lastClickedIndex: number | null
  /** Returns the items inside the inclusive range `[startIndex, endIndex]`. */
  getItemsInRange: (startIndex: number, endIndex: number) => TItem[]
  /**
   * Optional identity comparator. Defaults to reference equality, with a
   * structural fallback for plain objects (shallow, by `Object.keys(rowKey)`)
   * to preserve the previous default behaviour.
   */
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

  if (
    typeof a !== 'object' || a === null
    || typeof b !== 'object' || b === null
  ) {
    return false
  }

  const aKeys = Object.keys(a as object)

  if (aKeys.length === 0)
    return aKeys.length === Object.keys(b as object).length

  return aKeys.every(key =>
    (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key],
  )
}

/**
 * Checkbox handlers for click‑to‑toggle and shift+click range selection.
 *
 * Generic over the row shape `TItem`. Callers provide `getItemsInRange` (to
 * resolve a range into concrete rows) and optionally `isEqual` (for identity).
 */
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
        { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
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

  return {
    isSelected,
    handleMouseDown,
    handleKeyDown,
    handleChange,
  }
}
