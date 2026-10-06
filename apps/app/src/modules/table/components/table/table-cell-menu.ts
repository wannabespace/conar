import {
  ArrowTurnBackwardIcon,
  Copy02Icon,
  EraserIcon,
  FilterAddIcon,
  Link01Icon,
  PencilEdit02Icon,
  Sorting01Icon,
} from '@hugeicons/core-free-icons'
import { cellToFilterValues, EQUAL_FILTER } from '@tamery/shared/filters'

import type { AppMenuNode } from '~/components/app-menu'
import type { CellMenuExtra } from '~/core/table/cell/cell-menu'
import type { Column } from '~/core/table/cell/utils'
import { posthog } from '~/lib/posthog'

import type { TablePageStore } from '../../lib/store'
import { columnsOrder } from '../../lib/store'

export const tableCellMenu = ({
  column,
  onDiscardChange,
  onDiscardRow,
  onDuplicateRow,
  onPeek,
  onRename,
  onSetNull,
  store,
  value,
}: {
  column: Column
  onDiscardChange?: () => void
  onDiscardRow?: () => void
  onDuplicateRow?: () => void
  onPeek?: () => void
  onRename?: () => void
  onSetNull?: () => void
  store: TablePageStore
  value: unknown
}): CellMenuExtra => {
  const sorting = columnsOrder(store)
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
    ...(onPeek
      ? [{ icon: Link01Icon, label: 'Show References', onSelect: onPeek }]
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
          ...(onRename
            ? [
                {
                  icon: PencilEdit02Icon,
                  label: 'Rename Column',
                  onSelect: onRename,
                },
              ]
            : []),
          {
            disabled: value === null || value === undefined,
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
                    values: cellToFilterValues(EQUAL_FILTER, value),
                  },
                ],
              }))
              posthog.capture('cell_filter_added')
            },
          },
          {
            icon: Sorting01Icon,
            items: [
              {
                onValueChange: (next) =>
                  next === 'ASC' || next === 'DESC'
                    ? sorting.setOrder(column.id, next)
                    : sorting.removeOrder(column.id),
                options: [
                  { label: 'None', value: 'none' },
                  { label: 'Ascending', value: 'ASC' },
                  { label: 'Descending', value: 'DESC' },
                ],
                type: 'radio',
                value: store.get().orderBy[column.id] ?? 'none',
              },
            ],
            label: 'Sort',
            type: 'sub',
          },
        ],
        label: 'Column',
        type: 'group',
      },
    ],
    row: rowItems,
  }
}
