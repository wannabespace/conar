/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a virtualized flex grid cannot be built from table elements */
import { ArrowTurnBackwardIcon } from '@hugeicons/core-free-icons'
import type { GridRow } from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import type { CSSProperties } from 'react'
import { useSubscription } from 'seitu/react'

import { rowSelectId } from '~/core/table/cell/utils'
import type { GridEntry, PrimaryKeys } from '~/core/table/session'
import {
  getRowPrimaryKeysValues,
  isSaving,
  newRowsActions,
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
      tabIndex={-1}
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
  id,
  keys,
  rowIndex,
  rowKey,
  rows,
}: {
  id: string
  keys: string[]
  rowIndex: number
  rowKey: PrimaryKeys
  rows: GridRow[]
}) => {
  const store = useTableSessionStore()
  const isSelected = useSubscription(store, {
    selector: (state) => rowSelection.has(state, rowKey),
  })

  return (
    <Checkbox
      id={id}
      aria-label="Select row"
      tabIndex={-1}
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

const DiscardRow = ({ id }: { id: string }) => {
  const store = useTableSessionStore()
  const saving = useSubscription(store, { selector: isSaving })

  return (
    <IconButton
      variant="ghost-muted"
      size="icon-xs"
      className="-mr-1"
      icon={ArrowTurnBackwardIcon}
      label="Discard row"
      tabIndex={-1}
      disabled={saving}
      onClick={() => newRowsActions(store).discard(id)}
    />
  )
}

export const LeadingCell = ({
  entry,
  keys,
  rowIndex,
  rows,
  style,
}: {
  entry: GridEntry
  keys: string[]
  rowIndex: number
  rows: GridRow[]
  style?: CSSProperties
}) => (
  <div
    role="gridcell"
    className="bg-background group-hover/row:bg-accent z-10 flex items-center justify-end pr-3"
    style={style}
  >
    {entry.kind === 'new' ? (
      <DiscardRow id={entry.newRow.id} />
    ) : (
      <SelectRow
        id={rowSelectId(rowIndex)}
        keys={keys}
        rowIndex={entry.index}
        rowKey={entry.keys}
        rows={rows}
      />
    )}
  </div>
)
