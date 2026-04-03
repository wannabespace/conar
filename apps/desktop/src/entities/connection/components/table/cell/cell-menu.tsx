import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { CSSProperties, ReactNode } from 'react'
import { cellToFilterValues, FILTER_GROUPS, SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import {
  formatValueForPlainCell,
  recordToMarkdownTable,
  toCSV,
} from '@conar/shared/utils/files'
import { useTableContext } from '@conar/table/hooks'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@conar/ui/components/context-menu'
import { copy } from '@conar/ui/lib/copy'
import { Fragment, useMemo } from 'react'
import { toast } from 'sonner'
import { useCellContext } from './cell-context'
import { INTERNAL_COLUMN_IDS } from './utils'

const internalColumnIds = Object.values(INTERNAL_COLUMN_IDS)

function isDisabled(filter: Filter, cellValue: unknown): boolean {
  return filter.hasValue !== false && (cellValue === null || cellValue === undefined)
}

export function CellMenuAddFilterSubmenu({
  onAdd,
}: {
  onAdd: (filter: ActiveFilter) => void
}) {
  const { value, column } = useCellContext()

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        Add filter
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {SQL_FILTERS_GROUPED.map(({ group, filters }, index) => (
          <Fragment key={group}>
            {index > 0 && <ContextMenuSeparator />}
            <ContextMenuLabel>
              {FILTER_GROUPS[group]}
            </ContextMenuLabel>
            {filters.map(filter => (
              <ContextMenuItem
                key={filter.operator}
                disabled={isDisabled(filter, value)}
                onClick={() => {
                  onAdd({
                    column: column.id,
                    ref: filter,
                    values: cellToFilterValues(filter, value),
                  })
                  toast.success('Filter added')
                }}
              >
                {filter.label}
                <span className="ml-auto pl-2 text-xs text-muted-foreground">{filter.operator}</span>
              </ContextMenuItem>
            ))}
          </Fragment>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
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
  const { value, column, rowIndex, onAddFilter, onSort, sortOrder, onRenameColumn } = useCellContext()
  const row = useTableContext(({ rows }) => rows[rowIndex]!)
  const columns = useTableContext(({ columns }) => columns)
  const columnKeys = useMemo(() =>
    columns.map(c => c.id).filter(id => !internalColumnIds.includes(id)), [columns])
  const rowCopyDisabled = columnKeys.length === 0

  return (
    <ContextMenu open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger className="flex h-full min-h-0 min-w-0 shrink-0" style={style}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Cell</ContextMenuLabel>
          <ContextMenuItem
            onClick={() => {
              copy(formatValueForPlainCell(value), 'Cell value copied')
            }}
          >
            Copy value
          </ContextMenuItem>
          {onSetNull && (
            <ContextMenuItem onClick={onSetNull} disabled={value === null}>
              Set null
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
        {(onRenameColumn || onAddFilter || onSort) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel>Column</ContextMenuLabel>
              {onRenameColumn && (
                <ContextMenuItem onClick={onRenameColumn}>
                  Rename
                </ContextMenuItem>
              )}
              {onAddFilter && (
                <CellMenuAddFilterSubmenu onAdd={onAddFilter} />
              )}
              {onSort && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    Sort
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuRadioGroup
                      value={sortOrder ?? 'default'}
                      onValueChange={(value) => {
                        onSort(column.id, value === 'default' ? null : value as 'ASC' | 'DESC')
                      }}
                    >
                      <ContextMenuRadioItem value="default">
                        None
                      </ContextMenuRadioItem>
                      <ContextMenuRadioItem value="ASC">
                        Ascending
                      </ContextMenuRadioItem>
                      <ContextMenuRadioItem value="DESC">
                        Descending
                      </ContextMenuRadioItem>
                    </ContextMenuRadioGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
            </ContextMenuGroup>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Row</ContextMenuLabel>
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={rowCopyDisabled}>
              Copy as
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                disabled={rowCopyDisabled}
                onClick={() => {
                  copy(JSON.stringify(row, null, 2), 'Row copied as JSON')
                }}
              >
                JSON
              </ContextMenuItem>
              <ContextMenuItem
                disabled={rowCopyDisabled}
                onClick={() => {
                  copy(toCSV(columnKeys.map(key => ({ key })), [row]), 'Row copied as CSV')
                }}
              >
                CSV
              </ContextMenuItem>
              <ContextMenuItem
                disabled={rowCopyDisabled}
                onClick={() => {
                  copy(recordToMarkdownTable(row, columnKeys.map(key => ({ key }))), 'Row copied as Markdown table')
                }}
              >
                Markdown table
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
