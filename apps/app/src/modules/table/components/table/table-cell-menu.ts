import {
  ArrowTurnBackwardIcon,
  Copy02Icon,
  EraserIcon,
  FilterAddIcon,
  Link01Icon,
} from '@hugeicons/core-free-icons'
import { cellToFilterValues, EQUAL_FILTER } from '@tamery/shared/filters'

import type { AppMenuNode } from '~/components/app-menu'
import type { CellMenuExtra } from '~/core/table/cell/cell-menu'
import type { DataGridCell } from '~/core/table/cursor'
import type { TableSessionStore } from '~/core/table/session'
import { draftKey, draftsActions, newRowsActions } from '~/core/table/session'
import { posthog } from '~/lib/posthog'

import type { ColumnActions } from '../../lib/column-menu'
import { columnMenuItems } from '../../lib/column-menu'
import type { useStagedEdits } from '../../lib/staged-edits'
import type { TablePageStore } from '../../lib/store'
import { cellHop } from '../references/hops'
import type { OpenPeek } from '../references/reference-buttons'

export const tableCellMenu = ({
  actions,
  canInsert,
  cell,
  element,
  isEditable,
  onPeek,
  saving,
  sessionStore,
  staged,
  store,
}: {
  actions: ColumnActions
  canInsert: boolean
  cell: DataGridCell
  element: Element | null | undefined
  isEditable: boolean
  onPeek: OpenPeek
  saving: boolean
  sessionStore: TableSessionStore
  staged: ReturnType<typeof useStagedEdits>
  store: TablePageStore
}): CellMenuExtra => {
  const { column } = cell
  const entry = staged.rowAt(cell.rowIndex)
  const value = staged.valueOf(cell)
  // Filters match saved rows, so Filter by Value takes the stored value, never a pending draft.
  const storedValue = cell.row[column.id]
  const hop = cellHop(column, value)
  const hasDraft =
    entry.kind === 'saved' &&
    draftKey(entry.keys, column.id) in sessionStore.get().drafts
  const onDiscardChange =
    hasDraft && !saving
      ? () => draftsActions(sessionStore).discard(entry.keys, column.id)
      : undefined
  const onDiscardRow =
    entry.kind === 'new' && !saving
      ? () => newRowsActions(sessionStore).discard(entry.newRow.id)
      : undefined
  const onDuplicateRow = canInsert
    ? () => {
        posthog.capture('row_duplicated')
        staged.duplicate(cell)
      }
    : undefined
  const peek = hop && element ? () => onPeek(element, hop) : undefined
  const onSetNull =
    isEditable && column.isEditable !== false && column.isNullable
      ? () => staged.edit(cell, null)
      : undefined
  const columnItems = columnMenuItems({
    ...actions,
    anchor: element ?? null,
    column,
    store,
  })

  const rowItems: AppMenuNode[] = [
    ...(onDuplicateRow
      ? [{ icon: Copy02Icon, label: 'Duplicate Row', onSelect: onDuplicateRow }]
      : []),
    ...(onDiscardRow
      ? [
          {
            icon: ArrowTurnBackwardIcon,
            label: 'Discard Row',
            onSelect: onDiscardRow,
          },
        ]
      : []),
  ]
  const cellItems: AppMenuNode[] = [
    ...(onDiscardChange
      ? [
          {
            icon: ArrowTurnBackwardIcon,
            label: 'Discard Change',
            onSelect: onDiscardChange,
          },
        ]
      : []),
    ...(peek
      ? [{ icon: Link01Icon, label: 'Show References', onSelect: peek }]
      : []),
    ...(onSetNull
      ? [
          {
            disabled: value === null,
            icon: EraserIcon,
            label: 'Set Null',
            onSelect: onSetNull,
          },
        ]
      : []),
  ]

  return {
    cell: cellItems,
    groups: [
      {
        items: [
          {
            disabled: storedValue === null || storedValue === undefined,
            icon: FilterAddIcon,
            label: 'Filter by Value',
            onSelect: () => {
              store.set((state) => ({
                ...state,
                filters: [
                  ...state.filters,
                  {
                    column: column.id,
                    ref: EQUAL_FILTER,
                    values: cellToFilterValues(EQUAL_FILTER, storedValue),
                  },
                ],
              }))
              posthog.capture('cell_filter_added')
            },
          },
          { type: 'separator' },
          ...columnItems,
        ],
        label: 'Column',
        type: 'group',
      },
    ],
    row: rowItems,
  }
}
