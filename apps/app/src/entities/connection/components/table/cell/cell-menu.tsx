import type { Filter } from '@tamery/shared/filters'
import {
  cellToFilterValues,
  FILTER_GROUPS,
  SQL_FILTERS_GROUPED,
} from '@tamery/shared/filters'
import {
  formatValueForPlainCell,
  recordToMarkdownTable,
  toCSV,
} from '@tamery/shared/utils/files'
import { useTableContext } from '@tamery/table/hooks'
import { copy } from '@tamery/ui/lib/copy'
import type { CSSProperties, ReactNode } from 'react'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'

import { useCellContext } from './cell-context'
import { INTERNAL_COLUMN_IDS } from './utils'

const internalColumnIds = Object.values(INTERNAL_COLUMN_IDS)

const isDisabledFilter = (filter: Filter, cellValue: unknown): boolean =>
  filter.hasValue !== false && (cellValue === null || cellValue === undefined)

export const TableCellContextMenu = ({
  open,
  onOpenChange,
  style,
  onSetNull,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
  onSetNull?: () => void
  children: ReactNode
}) => {
  const { value, column, rowIndex, onAddFilter, onOrder, order, onRename } =
    useCellContext()
  const row = useTableContext(({ rows }) => rows[rowIndex] ?? {})
  const tableColumns = useTableContext(({ columns }) => columns)
  const columnKeys = tableColumns
    .map((c) => c.id)
    .filter((id) => !internalColumnIds.includes(id))
  const rowCopyDisabled = columnKeys.length === 0

  const items: AppMenuNode[] = [
    {
      items: [
        {
          label: 'Copy value',
          onSelect: () =>
            copy(formatValueForPlainCell(value), 'Cell value copied'),
        },
        ...(onSetNull
          ? [
              {
                disabled: value === null,
                label: 'Set null',
                onSelect: onSetNull,
              } as const,
            ]
          : []),
      ],
      label: 'Cell',
      type: 'group',
    },
  ]

  if (onRename || onAddFilter || onOrder) {
    const columnItems: AppMenuNode[] = []

    if (onRename) {
      columnItems.push({ label: 'Rename', onSelect: onRename })
    }

    if (onAddFilter) {
      const filterItems: AppMenuNode[] = []
      for (const [index, filterGroup] of SQL_FILTERS_GROUPED.entries()) {
        const { group, filters } = filterGroup
        if (index > 0) {
          filterItems.push({ type: 'separator' })
        }
        filterItems.push({ label: FILTER_GROUPS[group], type: 'label' })
        for (const filter of filters) {
          filterItems.push({
            disabled: isDisabledFilter(filter, value),
            label: filter.label,
            nativeLabel: `${filter.label} (${filter.operator})`,
            onSelect: () => {
              onAddFilter({
                column: column.id,
                ref: filter,
                values: cellToFilterValues(filter, value),
              })
              toast.success('Filter added')
            },
            trailing: (
              <span className="text-muted-foreground ml-auto pl-2 text-xs">
                {filter.operator}
              </span>
            ),
          })
        }
      }
      columnItems.push({
        items: filterItems,
        label: 'Add filter',
        type: 'sub',
      })
    }

    if (onOrder) {
      columnItems.push({
        items: [
          {
            onValueChange: (nextValue) => {
              onOrder(
                nextValue === 'default' ? null : (nextValue as 'ASC' | 'DESC')
              )
            },
            options: [
              { label: 'None', value: 'default' },
              { label: 'Ascending', value: 'ASC' },
              { label: 'Descending', value: 'DESC' },
            ],
            type: 'radio',
            value: order ?? 'default',
          },
        ],
        label: 'Sort',
        type: 'sub',
      })
    }

    items.push(
      { type: 'separator' },
      { items: columnItems, label: 'Column', type: 'group' }
    )
  }

  items.push(
    { type: 'separator' },
    {
      items: [
        {
          disabled: rowCopyDisabled,
          items: [
            {
              disabled: rowCopyDisabled,
              label: 'JSON',
              onSelect: () =>
                copy(JSON.stringify(row, null, 2), 'Row copied as JSON'),
            },
            {
              disabled: rowCopyDisabled,
              label: 'CSV',
              onSelect: () =>
                copy(
                  toCSV(
                    columnKeys.map((key) => ({ key })),
                    [row]
                  ),
                  'Row copied as CSV'
                ),
            },
            {
              disabled: rowCopyDisabled,
              label: 'Markdown table',
              onSelect: () =>
                copy(
                  recordToMarkdownTable(
                    row,
                    columnKeys.map((key) => ({ key }))
                  ),
                  'Row copied as Markdown table'
                ),
            },
          ],
          label: 'Copy as',
          type: 'sub',
        },
      ],
      label: 'Row',
      type: 'group',
    }
  )

  return (
    <AppContextMenu
      open={open}
      onOpenChange={onOpenChange}
      className="flex h-full min-h-0 min-w-0 shrink-0"
      style={style}
      items={items}
    >
      {children}
    </AppContextMenu>
  )
}
