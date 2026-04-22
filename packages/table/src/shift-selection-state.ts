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

export interface ShiftSelectionRange {
  start: number
  end: number
}

export type ShiftSelectionAction
  = | { type: 'noop' }
    | { type: 'select', range: ShiftSelectionRange, state: ShiftSelectionState }

export interface ShiftArrowKeyParams {
  direction: ShiftSelectionDirection
  rowCount: number
  state: ShiftSelectionState
}

function clampIndex(index: number, rowCount: number) {
  return Math.max(0, Math.min(index, rowCount - 1))
}

function makeRange(a: number, b: number): ShiftSelectionRange {
  return { start: Math.min(a, b), end: Math.max(a, b) }
}

function isShrinkingTowards(direction: ShiftSelectionDirection, anchorIndex: number, focusIndex: number) {
  const expandedDown = focusIndex > anchorIndex
  const expandedUp = focusIndex < anchorIndex

  return (expandedDown && direction === 'up') || (expandedUp && direction === 'down')
}

export function reduceShiftArrowKey({
  direction,
  rowCount,
  state,
}: ShiftArrowKeyParams): ShiftSelectionAction {
  if (rowCount === 0)
    return { type: 'noop' }

  const { anchorIndex, focusIndex, lastExpandDirection } = state
  const hasSelection = anchorIndex !== null && focusIndex !== null

  if (!hasSelection) {
    const startIndex = direction === 'down' ? 0 : rowCount - 1

    return {
      type: 'select',
      range: makeRange(startIndex, startIndex),
      state: {
        anchorIndex: startIndex,
        focusIndex: startIndex,
        lastExpandDirection: null,
      },
    }
  }

  const step = direction === 'down' ? 1 : -1
  const newFocusIndex = clampIndex(focusIndex + step, rowCount)

  if (newFocusIndex === focusIndex)
    return { type: 'noop' }

  const isShrinking = isShrinkingTowards(direction, anchorIndex, focusIndex)

  return {
    type: 'select',
    range: makeRange(anchorIndex, newFocusIndex),
    state: {
      anchorIndex,
      focusIndex: newFocusIndex,
      lastExpandDirection: isShrinking ? lastExpandDirection : direction,
    },
  }
}
