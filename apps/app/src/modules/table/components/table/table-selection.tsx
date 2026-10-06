/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import type { GridRow } from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { CSSProperties, RefObject } from 'react'
import { useSubscription } from 'seitu/react'

import { rowSelection } from '~/core/table/row-selection'
import {
  getRowPrimaryKeysValues,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'

const SelectAll = ({ keys, rows }: { keys: string[]; rows: GridRow[] }) => {
  const store = useTableSessionStore()
  const count = useSubscription(store, {
    selector: (state) => state.selected.length,
  })
  const checked = rows.length > 0 && count === rows.length

  return (
    <Checkbox
      aria-label="Select all rows"
      disabled={rows.length === 0}
      checked={checked}
      indeterminate={count > 0 && !checked}
      onCheckedChange={() =>
        store.set((state) => ({
          ...state,
          selected: checked
            ? []
            : rows.map((row) => getRowPrimaryKeysValues(row, keys)),
        }))
      }
    />
  )
}

export const LeadingHeaderCell = ({
  keys,
  rows,
  style,
}: {
  keys: string[]
  rows: GridRow[]
  style: CSSProperties
}) => (
  // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
  <div
    role="columnheader"
    className="bg-background z-10 flex items-center justify-end pr-3"
    style={style}
  >
    <SelectAll keys={keys} rows={rows} />
  </div>
)

const SelectRow = ({
  keys,
  row,
  rowIndex,
  rows,
}: {
  keys: string[]
  row: GridRow
  rowIndex: number
  rows: GridRow[]
}) => {
  const store = useTableSessionStore()
  const rowKey = getRowPrimaryKeysValues(row, keys)
  const isSelected = useSubscription(store, {
    selector: (state) =>
      state.selected.some(
        (selected) => primaryKeysKey(selected) === primaryKeysKey(rowKey)
      ),
  })

  return (
    <Checkbox
      aria-label="Select row"
      checked={isSelected}
      onCheckedChange={(_, { event }) => {
        const state = store.get()
        const update = rowSelection.click(
          event instanceof MouseEvent && event.shiftKey,
          {
            currentSelected: state.selected,
            getItemsInRange: (start, end) =>
              rows
                .slice(start, end + 1)
                .map((item) => getRowPrimaryKeysValues(item, keys)),
            isSelected,
            lastClickedIndex: state.lastClickedIndex,
            rowIndex,
            rowKey,
          }
        )
        store.set((current) => ({ ...current, ...update }))
      }}
    />
  )
}

export const LeadingCell = ({
  keys,
  row,
  rowIndex,
  rows,
  style,
}: {
  keys: string[] | null
  row: GridRow
  rowIndex: number
  rows: GridRow[]
  style: CSSProperties
}) => (
  // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
  <div
    role="gridcell"
    className="bg-background row-hover:bg-accent z-10 flex items-center justify-end pr-3"
    style={style}
  >
    {keys && (
      <SelectRow keys={keys} row={row} rowIndex={rowIndex} rows={rows} />
    )}
  </div>
)

/** Shift+↑/↓ grows a row selection while the grid has no cell cursor. */
export const useRowRangeKeys = ({
  enabled,
  hasCursor,
  keys,
  rows,
  target,
}: {
  enabled: boolean
  hasCursor: () => boolean
  keys: string[]
  rows: GridRow[]
  target: RefObject<HTMLElement | null>
}) => {
  const store = useTableSessionStore()
  useHotkeys(
    (['up', 'down'] as const).map((direction) => ({
      callback: () => {
        const update = hasCursor()
          ? null
          : rowSelection.extend(
              direction,
              rows.length,
              store.get().selectionState
            )
        if (update) {
          store.set((state) => ({
            ...state,
            selected: rows
              .slice(update.range.start, update.range.end + 1)
              .map((row) => getRowPrimaryKeysValues(row, keys)),
            selectionState: update.state,
          }))
        }
      },
      hotkey: direction === 'up' ? 'Shift+ArrowUp' : 'Shift+ArrowDown',
      // The grid binds the same keys to extend the cell block; each handler stands down while the other's mode is active.
      options: { conflictBehavior: 'allow', enabled },
    })),
    { target }
  )
}
