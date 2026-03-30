import type { ActiveFilter } from '@conar/shared/filters'
import type { CSSProperties, ReactNode } from 'react'
import {
  formatValueForPlainCell,
  recordsToCSV,
  recordToMarkdownTable,
  recordToPrettyJson,
  rowValuesToPlainText,
} from '@conar/shared/utils/files'
import { useTableContext } from '@conar/table'
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
import { useMemo } from 'react'
import { TableAddFilterSubmenu } from './table-add-filter-submenu'
import { INTERNAL_COLUMN_IDS } from './utils'

const internalColumnIds = Object.values(INTERNAL_COLUMN_IDS)

export function TableCellContextMenu({
  rowIndex,
  value,
  columnId,
  onAddFilter,
  onSort,
  sortOrder,
  onSetNull,
  isNull,
  onRenameColumn,
  open,
  onOpenChange,
  style,
  children,
}: {
  rowIndex: number
  value: unknown
  columnId: string
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onSetNull?: () => void
  isNull?: boolean
  onRenameColumn?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
  children: ReactNode
}) {
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
            <ContextMenuItem onClick={onSetNull} disabled={isNull}>
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
                <TableAddFilterSubmenu
                  columnId={columnId}
                  cellValue={value}
                  hasRow={!!row}
                  onAdd={onAddFilter}
                />
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
                        onSort(columnId, value === 'default' ? null : value as 'ASC' | 'DESC')
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
                  copy(rowValuesToPlainText(row, columnKeys), 'Row copied as plain text')
                }}
              >
                Plain text
              </ContextMenuItem>
              <ContextMenuItem
                disabled={rowCopyDisabled}
                onClick={() => {
                  copy(recordToPrettyJson(row), 'Row copied as JSON')
                }}
              >
                JSON
              </ContextMenuItem>
              <ContextMenuItem
                disabled={rowCopyDisabled}
                onClick={() => {
                  copy(recordsToCSV(columnKeys.map(key => ({ key })), [row]), 'Row copied as CSV')
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
