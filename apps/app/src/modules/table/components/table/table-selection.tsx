/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import type { GridRow } from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import type { CSSProperties } from 'react'
import { useSubscription } from 'seitu/react'

import type { GridEntry, PrimaryKeys } from '~/core/table/session'
import {
  getRowPrimaryKeysValues,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'

import { rowSelection } from '../../lib/row-selection'

export const keysInRange =
  (rows: GridRow[], keys: string[]) => (start: number, end: number) =>
    rows.slice(start, end + 1).map((row) => getRowPrimaryKeysValues(row, keys))

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
  style?: CSSProperties
}) => (
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
  rowIndex,
  rowKey,
  rows,
}: {
  keys: string[]
  rowIndex: number
  rowKey: PrimaryKeys
  rows: GridRow[]
}) => {
  const store = useTableSessionStore()
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
      onCheckedChange={(_, { event }) =>
        store.set((state) =>
          rowSelection.click(state, {
            isShiftHeld: event instanceof MouseEvent && event.shiftKey,
            keysInRange: keysInRange(rows, keys),
            rowIndex,
            rowKey,
          })
        )
      }
    />
  )
}

export const LeadingCell = ({
  entry,
  keys,
  rows,
  style,
}: {
  entry: GridEntry
  keys: string[]
  rows: GridRow[]
  style?: CSSProperties
}) => (
  <div
    role="gridcell"
    className="bg-background group-hover/row:bg-accent z-10 flex items-center justify-end pr-3"
    style={style}
  >
    {entry.kind === 'saved' && (
      <SelectRow
        keys={keys}
        rowIndex={entry.index}
        rowKey={entry.keys}
        rows={rows}
      />
    )}
  </div>
)
