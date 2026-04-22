export type ShiftSelectionDirection = 'up' | 'down'

/**
 * Anchor/focus model used for keyboard and shift‑click range selection.
 *
 * - `anchorIndex` is the pivot point where the current selection started.
 * - `focusIndex` is the currently focused row; the inclusive range between
 *   anchor and focus defines the selection.
 * - `lastExpandDirection` is the last direction in which the range was
 *   extended (not shrunk). It is preserved while the selection is shrinking,
 *   which matches the behaviour of native macOS / Finder‑style selection.
 */
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

export type ShiftSelectionAction
  = | { type: 'noop' }
    | {
      type: 'select'
      /** Inclusive `[start, end]` range of row indices to mark as selected. */
      range: { start: number, end: number }
      /** Next selection state to commit. */
      state: ShiftSelectionState
    }

export interface ShiftArrowKeyParams {
  direction: ShiftSelectionDirection
  rowCount: number
  state: ShiftSelectionState
}

/**
 * Pure reducer that computes the next selection after a shift+ArrowUp / ArrowDown
 * press. Kept free of React so it can be unit‑tested in isolation and reused by
 * non‑hook callers.
 */
export function reduceShiftArrowKey({
  direction,
  rowCount,
  state,
}: ShiftArrowKeyParams): ShiftSelectionAction {
  if (rowCount === 0)
    return { type: 'noop' }

  const isDown = direction === 'down'
  const { anchorIndex, focusIndex, lastExpandDirection } = state

  // No active selection yet — anchor on the nearest edge in the pressed direction.
  if (anchorIndex === null || focusIndex === null) {
    const startIndex = isDown ? 0 : rowCount - 1

    return {
      type: 'select',
      range: { start: startIndex, end: startIndex },
      state: {
        anchorIndex: startIndex,
        focusIndex: startIndex,
        lastExpandDirection: null,
      },
    }
  }

  const newFocusIndex = isDown
    ? Math.min(focusIndex + 1, rowCount - 1)
    : Math.max(focusIndex - 1, 0)

  // Already at the top/bottom edge — nothing to do.
  if (newFocusIndex === focusIndex)
    return { type: 'noop' }

  const wasExpandedDown = focusIndex > anchorIndex
  const wasExpandedUp = focusIndex < anchorIndex
  const isShrinking = (wasExpandedDown && !isDown) || (wasExpandedUp && isDown)

  return {
    type: 'select',
    range: {
      start: Math.min(anchorIndex, newFocusIndex),
      end: Math.max(anchorIndex, newFocusIndex),
    },
    state: {
      anchorIndex,
      focusIndex: newFocusIndex,
      lastExpandDirection: isShrinking ? lastExpandDirection : direction,
    },
  }
}
