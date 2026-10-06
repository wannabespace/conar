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
  const canSetNull =
    isEditable && column.isEditable !== false && column.isNullable

  const rowItems: AppMenuNode[] = [
    ...(canInsert
      ? [
          {
            icon: Copy02Icon,
            label: 'Duplicate Row',
            onSelect: () => {
              posthog.capture('row_duplicated')
              staged.duplicate(cell)
            },
          },
        ]
      : []),
    ...(entry.kind === 'new' && !saving
      ? [
          {
            icon: ArrowTurnBackwardIcon,
            label: 'Discard Row',
            onSelect: () =>
              newRowsActions(sessionStore).discard(entry.newRow.id),
          },
        ]
      : []),
  ]
  const cellItems: AppMenuNode[] = [
    ...(hasDraft && !saving
      ? [
          {
            icon: ArrowTurnBackwardIcon,
            label: 'Discard Change',
            onSelect: () =>
              draftsActions(sessionStore).discard(entry.keys, column.id),
          },
        ]
      : []),
    ...(hop && element
      ? [
          {
            icon: Link01Icon,
            label: 'Show References',
            onSelect: () => onPeek(element, hop),
          },
        ]
      : []),
    ...(canSetNull
      ? [
          {
            disabled: value === null,
            icon: EraserIcon,
            label: 'Set Null',
            onSelect: () => staged.edit(cell, null),
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
          ...columnMenuItems({
            ...actions,
            anchor: element ?? null,
            column,
            store,
          }),
        ],
        label: 'Column',
        type: 'group',
      },
    ],
    row: rowItems,
  }
}
