import {
  CodeIcon,
  Copy01Icon,
  Csv01Icon,
  EraserIcon,
  FilterIcon,
  PencilEdit02Icon,
  Sorting01Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import {
  formatValueForPlainCell,
  recordToMarkdownTable,
  toCSV,
} from '@tamery/shared/files'
import { cellToFilterValues, EQUAL_FILTER } from '@tamery/shared/filters'
import { useTableContext } from '@tamery/table/hooks'
import { copy } from '@tamery/ui/lib/copy'
import type { CSSProperties, ReactNode } from 'react'
import { toast } from 'sonner'

import { AppContextMenu } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'

import { useCellContext } from './cell-context'
import { INTERNAL_COLUMN_IDS } from './utils'

const internalColumnIds = Object.values(INTERNAL_COLUMN_IDS)

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
          icon: Copy01Icon,
          label: 'Copy value',
          onSelect: () =>
            copy(formatValueForPlainCell(value), 'Cell value copied'),
        },
        ...(onSetNull
          ? [
              {
                disabled: value === null,
                icon: EraserIcon,
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
      columnItems.push({
        icon: PencilEdit02Icon,
        label: 'Rename',
        onSelect: onRename,
      })
    }

    if (onAddFilter) {
      columnItems.push({
        disabled: value === null || value === undefined,
        icon: FilterIcon,
        label: 'Filter by value',
        onSelect: () => {
          onAddFilter({
            column: column.id,
            ref: EQUAL_FILTER,
            values: cellToFilterValues(EQUAL_FILTER, value),
          })
          toast.success('Filter added')
        },
      })
    }

    if (onOrder) {
      columnItems.push({
        icon: Sorting01Icon,
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
          icon: Copy01Icon,
          items: [
            {
              disabled: rowCopyDisabled,
              icon: CodeIcon,
              label: 'JSON',
              onSelect: () =>
                copy(JSON.stringify(row, null, 2), 'Row copied as JSON'),
            },
            {
              disabled: rowCopyDisabled,
              icon: Csv01Icon,
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
              icon: TextIcon,
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
