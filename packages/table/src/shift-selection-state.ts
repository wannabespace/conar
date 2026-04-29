export type ShiftSelectionDirection = 'up' | 'down'

export interface ShiftSelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: ShiftSelectionDirection | null
}

export const INITIAL_SHIFT_SELECTION_STATE: ShiftSelectionState = {
  anchorIndex: null,
  focusIndex: null,
  lastExpandDirection: null,
}

export interface ShiftSelectionUpdate {
  state: ShiftSelectionState
  range: { start: number, end: number }
}

export function reduceShiftArrowKey(
  direction: ShiftSelectionDirection,
  rowCount: number,
  state: ShiftSelectionState,
): ShiftSelectionUpdate | null {
  if (rowCount === 0)
    return null

  const { anchorIndex, focusIndex, lastExpandDirection } = state
  const step = direction === 'down' ? 1 : -1

  if (anchorIndex === null || focusIndex === null) {
    const index = direction === 'down' ? 0 : rowCount - 1

    return {
      range: { start: index, end: index },
      state: { anchorIndex: index, focusIndex: index, lastExpandDirection: null },
    }
  }

  const newFocus = Math.max(0, Math.min(focusIndex + step, rowCount - 1))

  if (newFocus === focusIndex)
    return null

  const isShrinking = (focusIndex - anchorIndex) * step < 0

  return {
    range: { start: Math.min(anchorIndex, newFocus), end: Math.max(anchorIndex, newFocus) },
    state: {
      anchorIndex,
      focusIndex: newFocus,
      lastExpandDirection: isShrinking ? lastExpandDirection : direction,
    },
  }
}
