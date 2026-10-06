import type { PrimaryKeys, TableSessionState } from './session'
import { primaryKeysKey } from './session'

type SelectionState = TableSessionState['selectionState']

const at = (index: number): SelectionState => ({
  anchorIndex: index,
  focusIndex: index,
})

export const rowSelection = {
  click: (
    isShiftHeld: boolean,
    {
      currentSelected,
      getItemsInRange,
      isSelected,
      lastClickedIndex,
      rowIndex,
      rowKey,
    }: {
      currentSelected: PrimaryKeys[]
      getItemsInRange: (startIndex: number, endIndex: number) => PrimaryKeys[]
      isSelected: boolean
      lastClickedIndex: number | null
      rowIndex: number
      rowKey: PrimaryKeys
    }
  ): Pick<
    TableSessionState,
    'lastClickedIndex' | 'selected' | 'selectionState'
  > => {
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
        selectionState: { anchorIndex: lastClickedIndex, focusIndex: rowIndex },
      }
    }
    if (isSelected) {
      const key = primaryKeysKey(rowKey)
      return {
        lastClickedIndex: rowIndex,
        selected: currentSelected.filter((row) => primaryKeysKey(row) !== key),
        selectionState: { anchorIndex: null, focusIndex: null },
      }
    }
    return {
      lastClickedIndex: rowIndex,
      selected: [...currentSelected, rowKey],
      selectionState: at(rowIndex),
    }
  },
  /** Shift+↑/↓ without a cell cursor; `null` when the focus is already at the edge. */
  extend: (
    direction: 'up' | 'down',
    rowCount: number,
    { anchorIndex, focusIndex }: SelectionState
  ) => {
    if (rowCount === 0) {
      return null
    }
    if (anchorIndex === null || focusIndex === null) {
      const index = direction === 'down' ? 0 : rowCount - 1
      return { range: { end: index, start: index }, state: at(index) }
    }
    const focus = Math.max(
      0,
      Math.min(focusIndex + (direction === 'down' ? 1 : -1), rowCount - 1)
    )
    if (focus === focusIndex) {
      return null
    }
    return {
      range: {
        end: Math.max(anchorIndex, focus),
        start: Math.min(anchorIndex, focus),
      },
      state: { anchorIndex, focusIndex: focus },
    }
  },
}
