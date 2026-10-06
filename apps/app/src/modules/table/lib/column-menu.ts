import {
  ArrowDown02Icon,
  ArrowLeftRightIcon,
  ArrowUp02Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  Copy01Icon,
  LayoutThreeColumnIcon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  Tag01Icon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { copy } from '@tamery/ui/lib/copy'

import type { AppMenuNode } from '~/components/app-menu'
import type { Column } from '~/core/table/cell/utils'
import { posthog } from '~/lib/posthog'

import type { TablePageStore } from './store'
import { columnLayout, columnsOrder } from './store'

const OFF = '__off__'
const CANNOT_SORT_TYPES = new Set(['json'])

export interface ColumnActions {
  onRename?: () => void
  onDistinctValues?: (anchor: Element) => void
}

/** The column's menu, read from the page store when it opens; the header and a cell's Column group both show it. */
export const columnMenuItems = ({
  anchor,
  column,
  labels,
  onDistinctValues,
  onRename,
  store,
}: ColumnActions & {
  anchor: Element | null
  column: Column
  /** Referenced columns that can label a foreign key, and the one shown. */
  labels?: { columns: string[]; current?: string }
  store: TablePageStore
}): AppMenuNode[] => {
  const state = store.get()
  const order = state.orderBy[column.id] ?? null
  const isPinned = state.pinnedColumns.includes(column.id)
  const hasCustomSize = column.id in state.columnSizes
  const layout = columnLayout(store)
  const sorting = columnsOrder(store)
  const isSortable =
    !!column.typeLabel && !CANNOT_SORT_TYPES.has(column.typeLabel)

  return [
    ...(isSortable
      ? ([
          {
            checked: order === 'ASC' || undefined,
            icon: ArrowUp02Icon,
            label: 'Sort Ascending',
            onSelect: () =>
              order === 'ASC'
                ? sorting.removeOrder(column.id)
                : sorting.setOrder(column.id, 'ASC'),
          },
          {
            checked: order === 'DESC' || undefined,
            icon: ArrowDown02Icon,
            label: 'Sort Descending',
            onSelect: () =>
              order === 'DESC'
                ? sorting.removeOrder(column.id)
                : sorting.setOrder(column.id, 'DESC'),
          },
          ...(order
            ? [
                {
                  icon: Cancel01Icon,
                  label: 'Clear Sort',
                  onSelect: () => sorting.removeOrder(column.id),
                },
              ]
            : []),
          { type: 'separator' },
        ] satisfies AppMenuNode[])
      : []),
    ...(onRename
      ? [{ icon: PencilEdit02Icon, label: 'Rename Column', onSelect: onRename }]
      : []),
    {
      icon: Copy01Icon,
      label: 'Copy Name',
      onSelect: () => copy(column.id, 'Column name copied'),
    },
    ...(onDistinctValues
      ? [
          {
            icon: ChartHistogramIcon,
            label: 'Distinct Values',
            onSelect: () => {
              posthog.capture('distinct_values_opened')
              if (anchor) {
                onDistinctValues(anchor)
              }
            },
          },
        ]
      : []),
    ...(labels && labels.columns.length > 0
      ? [
          {
            icon: Tag01Icon,
            items: [
              {
                onValueChange: (next: string) => {
                  posthog.capture('column_labels_set', { shown: next !== OFF })
                  layout.setLabel(column.id, next === OFF ? '' : next)
                },
                options: [
                  { label: 'Off', value: OFF },
                  ...labels.columns.map((id) => ({ label: id, value: id })),
                ],
                type: 'radio',
                value: labels.current ?? OFF,
              } satisfies AppMenuNode,
            ],
            label: 'Show Labels',
            type: 'sub',
          } satisfies AppMenuNode,
        ]
      : []),
    { type: 'separator' },
    {
      icon: isPinned ? PinOffIcon : PinIcon,
      label: isPinned ? 'Unpin Column' : 'Pin Column',
      onSelect: () => {
        posthog.capture('column_pin_toggled', { pinned: !isPinned })
        layout.togglePin(column.id)
      },
    },
    {
      icon: ViewOffSlashIcon,
      label: 'Hide Column',
      onSelect: () => layout.hide(column.id),
    },
    ...(hasCustomSize
      ? [
          {
            icon: ArrowLeftRightIcon,
            label: 'Reset Width',
            onSelect: () => layout.resetSize(column.id),
          },
        ]
      : []),
    ...(state.columnOrder.length > 0
      ? [
          {
            icon: LayoutThreeColumnIcon,
            label: 'Reset Column Order',
            onSelect: layout.resetOrder,
          },
        ]
      : []),
  ]
}
