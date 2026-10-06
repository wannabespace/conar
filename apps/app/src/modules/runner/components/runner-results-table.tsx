import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { formatValueForPlainCell } from '@tamery/shared/files'

import type { Column } from '~/core/table/cell/utils'
import { DataGrid } from '~/core/table/data-grid'

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
      .map((row) => formatValueForPlainCell(row[columnId]).length)
  )
  return Math.min(
    Math.max(longest * CHAR_WIDTH + CELL_PADDING, MIN_WIDTH),
    isLast ? MAX_LAST_WIDTH : MAX_WIDTH
  )
}

export const RunnerResultsTable = ({
  columns,
  rows,
  connectionType,
}: {
  columns: string[]
  rows: Record<string, unknown>[]
  connectionType: ConnectionType
}) => (
  <DataGrid
    rows={rows}
    columns={columns.map((id): Column => ({ id, uiType: 'raw' }))}
    connectionType={connectionType}
    sizeOf={(column) =>
      columnWidth(column.id, rows, column.id === columns.at(-1))
    }
  />
)
