import type { Filter } from '@tamery/shared/filters'
import { cellToFilterValues, FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@tamery/shared/filters'
import { formatValueForPlainCell, recordToMarkdownTable, toCSV } from '@tamery/shared/utils/files'
import { useTableContext } from '@tamery/table/hooks'
import { copy } from '@tamery/ui/lib/copy'
import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'

import { useCellContext } from './cell-context'
import { INTERNAL_COLUMN_IDS } from './utils'

const internalColumnIds = Object.values(INTERNAL_COLUMN_IDS)

function isDisabledFilter(filter: Filter, cellValue: unknown): boolean {
  return filter.hasValue !== false && (cellValue === null || cellValue === undefined)
}

export function TableCellContextMenu({
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
}) {
  const { value, column, rowIndex, onAddFilter, onOrder, order, onRename } = useCellContext()
  const row = useTableContext(({ rows }) => rows[rowIndex]!)
  const columns = useTableContext(({ columns }) => columns)
  const columnKeys = useMemo(
    () => columns.map(c => c.id).filter(id => !internalColumnIds.includes(id)),
    [columns],
  )
  const rowCopyDisabled = columnKeys.length === 0

  const items = useMemo<AppMenuNode[]>(() => {
    const nodes: AppMenuNode[] = [
      {
        type: 'group',
        label: 'Cell',
        items: [
          {
            label: 'Copy value',
            onSelect: () => copy(formatValueForPlainCell(value), 'Cell value copied'),
          },
          ...(onSetNull
            ? [{ label: 'Set null', onSelect: onSetNull, disabled: value === null } as const]
            : []),
        ],
      },
    ]

    if (onRename || onAddFilter || onOrder) {
      const columnItems: AppMenuNode[] = []

      if (onRename) {
        columnItems.push({ label: 'Rename', onSelect: onRename })
      }

      if (onAddFilter) {
        const filterItems: AppMenuNode[] = []
        SQL_FILTERS_GROUPED.forEach(({ group, filters }, index) => {
          if (index > 0) filterItems.push({ type: 'separator' })
          filterItems.push({ type: 'label', label: FILTER_GROUPS[group] })
          for (const filter of filters) {
            filterItems.push({
              label: filter.label,
              nativeLabel: `${filter.label} (${filter.operator})`,
              disabled: isDisabledFilter(filter, value),
              trailing: (
                <span className="ml-auto pl-2 text-xs text-muted-foreground">
                  {filter.operator}
                </span>
              ),
              onSelect: () => {
                onAddFilter({
                  column: column.id,
                  ref: filter,
                  values: cellToFilterValues(filter, value),
                })
                toast.success('Filter added')
              },
            })
          }
        })
        columnItems.push({ type: 'sub', label: 'Add filter', items: filterItems })
      }

      if (onOrder) {
        columnItems.push({
          type: 'sub',
          label: 'Sort',
          items: [
            {
              type: 'radio',
              value: order ?? 'default',
              onValueChange: value => {
                onOrder(value === 'default' ? null : (value as 'ASC' | 'DESC'))
              },
              options: [
                { value: 'default', label: 'None' },
                { value: 'ASC', label: 'Ascending' },
                { value: 'DESC', label: 'Descending' },
              ],
            },
          ],
        })
      }

      nodes.push({ type: 'separator' })
      nodes.push({ type: 'group', label: 'Column', items: columnItems })
    }

    nodes.push({ type: 'separator' })
    nodes.push({
      type: 'group',
      label: 'Row',
      items: [
        {
          type: 'sub',
          label: 'Copy as',
          disabled: rowCopyDisabled,
          items: [
            {
              label: 'JSON',
              disabled: rowCopyDisabled,
              onSelect: () => copy(JSON.stringify(row, null, 2), 'Row copied as JSON'),
            },
            {
              label: 'CSV',
              disabled: rowCopyDisabled,
              onSelect: () =>
                copy(
                  toCSV(
                    columnKeys.map(key => ({ key })),
                    [row],
                  ),
                  'Row copied as CSV',
                ),
            },
            {
              label: 'Markdown table',
              disabled: rowCopyDisabled,
              onSelect: () =>
                copy(
                  recordToMarkdownTable(
                    row,
                    columnKeys.map(key => ({ key })),
                  ),
                  'Row copied as Markdown table',
                ),
            },
          ],
        },
      ],
    })

    return nodes
  }, [
    value,
    column,
    row,
    columnKeys,
    rowCopyDisabled,
    onAddFilter,
    onOrder,
    order,
    onRename,
    onSetNull,
  ])

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
