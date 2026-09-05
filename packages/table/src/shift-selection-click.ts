import type { ChangeEvent } from 'react'

import type { ShiftSelectionState } from './shift-selection-state'
import { INITIAL_SHIFT_SELECTION_STATE } from './shift-selection-state'

export interface ShiftSelectionClickOptions<TItem> {
  currentSelected: TItem[]
  getItemsInRange: (startIndex: number, endIndex: number) => TItem[]
  isSelected: boolean
  lastClickedIndex: number | null
  rowIndex: number
  rowKey: TItem
}

export interface ShiftSelectionClickUpdate<TItem> {
  lastClickedIndex: number
  selected: TItem[]
  state: ShiftSelectionState
}

export const isShiftClick = (event: ChangeEvent<HTMLInputElement>) =>
  event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey

export const reduceShiftClick = <TItem extends Record<string, unknown>>(
  isShiftHeld: boolean,
  {
    currentSelected,
    getItemsInRange,
    isSelected,
    lastClickedIndex,
    rowIndex,
    rowKey,
  }: ShiftSelectionClickOptions<TItem>
): ShiftSelectionClickUpdate<TItem> => {
  if (
    isShiftHeld &&
    lastClickedIndex !== null &&
    lastClickedIndex !== rowIndex
  ) {
    return {
      lastClickedIndex: rowIndex,
      selected: getItemsInRange(
        Math.min(lastClickedIndex, rowIndex),
        Math.max(lastClickedIndex, rowIndex)
      ),
      state: {
        anchorIndex: lastClickedIndex,
        focusIndex: rowIndex,
        lastExpandDirection: rowIndex > lastClickedIndex ? 'down' : 'up',
      },
    }
  }

  if (isSelected) {
    return {
      lastClickedIndex: rowIndex,
      selected: currentSelected.filter(
        (row) => !Object.keys(rowKey).every((key) => row[key] === rowKey[key])
      ),
      state: INITIAL_SHIFT_SELECTION_STATE,
    }
  }

  return {
    lastClickedIndex: rowIndex,
    selected: [...currentSelected, rowKey],
    state: {
      anchorIndex: rowIndex,
      focusIndex: rowIndex,
      lastExpandDirection: null,
    },
  }
}
