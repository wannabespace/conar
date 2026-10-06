import type { PrimaryKeys, TableSessionState } from '~/core/table/session'
import { primaryKeysKey } from '~/core/table/session'

type SelectionState = TableSessionState['selectionState']

const at = (index: number): SelectionState => ({
  anchorIndex: index,
  focusIndex: index,
})

export const rowSelection = {
  click: (
    state: TableSessionState,
    {
      isShiftHeld,
      keysInRange,
      rowIndex,
      rowKey,
    }: {
      isShiftHeld: boolean
      keysInRange: (start: number, end: number) => PrimaryKeys[]
      rowIndex: number
      rowKey: PrimaryKeys
    }
  ): TableSessionState => {
    const { lastClickedIndex, selected } = state
    if (
      isShiftHeld &&
      lastClickedIndex !== null &&
      lastClickedIndex !== rowIndex
    ) {
      return {
        ...state,
        lastClickedIndex: rowIndex,
        selected: keysInRange(
          Math.min(lastClickedIndex, rowIndex),
          Math.max(lastClickedIndex, rowIndex)
        ),
        selectionState: { anchorIndex: lastClickedIndex, focusIndex: rowIndex },
      }
    }
    const key = primaryKeysKey(rowKey)
    if (selected.some((row) => primaryKeysKey(row) === key)) {
      return {
        ...state,
        lastClickedIndex: rowIndex,
        selected: selected.filter((row) => primaryKeysKey(row) !== key),
        selectionState: { anchorIndex: null, focusIndex: null },
      }
    }
    return {
      ...state,
      lastClickedIndex: rowIndex,
      selected: [...selected, rowKey],
      selectionState: at(rowIndex),
    }
  },
  /** Shift+↑/↓ without a cell cursor; unchanged when the focus is already at the edge. */
  extend: (
    state: TableSessionState,
    {
      direction,
      keysInRange,
      rowCount,
    }: {
      direction: 'up' | 'down'
      keysInRange: (start: number, end: number) => PrimaryKeys[]
      rowCount: number
    }
  ): TableSessionState => {
    const { anchorIndex, focusIndex } = state.selectionState
    if (rowCount === 0) {
      return state
    }
    if (anchorIndex === null || focusIndex === null) {
      const index = direction === 'down' ? 0 : rowCount - 1
      return {
        ...state,
        selected: keysInRange(index, index),
        selectionState: at(index),
      }
    }
    const focus = Math.max(
      0,
      Math.min(focusIndex + (direction === 'down' ? 1 : -1), rowCount - 1)
    )
    if (focus === focusIndex) {
      return state
    }
    return {
      ...state,
      selected: keysInRange(
        Math.min(anchorIndex, focus),
        Math.max(anchorIndex, focus)
      ),
      selectionState: { anchorIndex, focusIndex: focus },
    }
  },
}
