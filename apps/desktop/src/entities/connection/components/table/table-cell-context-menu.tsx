import type { ActiveFilter } from '@conar/shared/filters'
import type { TabularColumnSpec } from '@conar/shared/utils/files'
import type { CSSProperties, ReactNode } from 'react'
import type { Column } from './utils'
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
  column,
  contextMenu,
  open,
  onOpenChange,
  style,
  children,
}: {
  rowIndex: number
  value: unknown
  column: Column
  contextMenu: {
    dataColumnSpecs: TabularColumnSpec[]
    onAddFilter: (filter: ActiveFilter) => void
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
  children: ReactNode
}) {
  const row = useTableContext(({ rows }) => rows[rowIndex])
  const dataColumnSpecs = contextMenu.dataColumnSpecs
  const rowCopyDisabled = dataColumnSpecs.length === 0

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
                if (!row)
                  return

                copy(rowValuesToPlainText(row, dataColumnSpecs.map(c => c.key)), 'Row copied as plain text')
              }}
            >
              Plain text
            </ContextMenuItem>
            <ContextMenuItem
              disabled={rowCopyDisabled}
              onClick={() => {
                if (!row)
                  return
                copy(recordToPrettyJson(row), 'Row copied as JSON')
              }}
            >
              JSON
            </ContextMenuItem>
            <ContextMenuItem
              disabled={rowCopyDisabled}
              onClick={() => {
                if (!row)
                  return
                copy(recordsToCSV(dataColumnSpecs, [row]), 'Row copied as CSV')
              }}
            >
              CSV
            </ContextMenuItem>
            <ContextMenuItem
              disabled={rowCopyDisabled}
              onClick={() => {
                if (!row)
                  return
                copy(recordToMarkdownTable(row, dataColumnSpecs), 'Row copied as Markdown table')
              }}
            >
              Markdown table
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <TableAddFilterSubmenu
          columnId={column.id}
          cellValue={value}
          hasRow={!!row}
          onAdd={contextMenu.onAddFilter}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}
