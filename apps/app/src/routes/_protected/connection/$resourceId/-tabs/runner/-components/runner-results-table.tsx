import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ColumnRenderer } from '@tamery/table'
import { Table, TableBody, TableHeader, TableProvider } from '@tamery/table'
import type { ColumnPosition } from '@tamery/table/utils'
import { formatCellValue } from '@tamery/table/utils'
import { cn } from '@tamery/ui/lib/utils'

import { TableCell } from '~/entities/connection/components/table/cell/cell'

const ResultColumnHeader = ({
  columnId,
  position,
  style,
}: {
  columnId: string
  position: ColumnPosition
  style?: React.CSSProperties
}) => (
  <div
    className={cn(
      'flex w-full shrink-0 items-center px-2 py-1.5',
      position === 'first' && 'pl-4',
      position === 'last' && 'pr-4'
    )}
    style={style}
  >
    <div data-mask className="truncate text-xs font-medium" title={columnId}>
      {columnId}
    </div>
  </div>
)

const CHAR_WIDTH = 7
const CELL_PADDING = 40
const MIN_WIDTH = 96
const MAX_WIDTH = 480
const MAX_LAST_WIDTH = 1200
const SAMPLED_ROWS = 50

const columnWidth = (
  columnId: string,
  rows: Record<string, unknown>[],
  isLast: boolean
) => {
  const longest = Math.max(
    columnId.length,
    ...rows
      .slice(0, SAMPLED_ROWS)
      .map((row) => formatCellValue(row[columnId]).length)
  )
  return Math.min(
    Math.max(longest * CHAR_WIDTH + CELL_PADDING, MIN_WIDTH),
    isLast ? MAX_LAST_WIDTH : MAX_WIDTH
  )
}

const resultColumn = (
  columnId: string,
  connectionType: ConnectionType,
  size: number
): ColumnRenderer => ({
  cell: (props) => (
    <TableCell
      {...props}
      column={{ id: columnId, uiType: 'raw' }}
      connectionType={connectionType}
    />
  ),
  header: ({ position, style }) => (
    <ResultColumnHeader columnId={columnId} position={position} style={style} />
  ),
  id: columnId,
  size,
})

export const RunnerResultsTable = ({
  columns,
  rows,
  connectionType,
}: {
  /** Unique names, in the order the statement selected them. */
  columns: string[]
  rows: Record<string, unknown>[]
  connectionType: ConnectionType
}) => (
  <TableProvider
    rows={rows}
    columns={columns.map((columnId, index) =>
      resultColumn(
        columnId,
        connectionType,
        columnWidth(columnId, rows, index === columns.length - 1)
      )
    )}
  >
    <Table className="h-full">
      <TableHeader className="bg-background rounded-none inset-shadow-[0_-1px_0_0_var(--color-border)] inset-ring-0" />
      <TableBody data-mask zebra className="bg-transparent" />
    </Table>
  </TableProvider>
)
