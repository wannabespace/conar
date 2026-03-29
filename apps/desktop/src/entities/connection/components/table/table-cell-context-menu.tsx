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
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@conar/ui/components/context-menu'
import { copy } from '@conar/ui/lib/copy'
import { TableAddFilterSubmenu } from './table-add-filter-submenu'

export function TableCellContextMenu({
  rowIndex,
  value,
  columnId,
  contextMenu,
  open,
  onOpenChange,
  style,
  children,
}: {
  rowIndex: number
  value: unknown
  columnId: string
  contextMenu: {
    onAddFilter: (filter: ActiveFilter) => void
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
  children: ReactNode
}) {
  const row = useTableContext(({ rows }) => rows[rowIndex]!)
  const columnKeys = useTableContext(({ columns }) =>
    columns.map(c => c.id).filter(id => !id.startsWith('!__')),
  )
  const rowCopyDisabled = columnKeys.length === 0

  return (
    <ContextMenu open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger className="flex h-full min-h-0 min-w-0 shrink-0" style={style}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>
            Copy
          </ContextMenuLabel>
          <ContextMenuItem
            onClick={() => {
              copy(formatValueForPlainCell(value), 'Cell value copied')
            }}
          >
            Copy Cell Value
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={rowCopyDisabled}>
            Copy Row As
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
        <ContextMenuSeparator />
        <TableAddFilterSubmenu
          columnId={columnId}
          cellValue={value}
          hasRow={!!row}
          onAdd={contextMenu.onAddFilter}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}
