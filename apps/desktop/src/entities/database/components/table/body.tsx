import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'
import { useTableContext } from '.'

const RowColumn = memo(function RowColumnMemo({
  value,
  rowIndex,
  virtualColumn,
  column,
}: {
  value: unknown
  rowIndex: number
  virtualColumn: VirtualItem
  column: ColumnRenderer
}) {
  return (
    <div
      data-column-index={virtualColumn.index}
      className="group/cell absolute top-0 left-0 h-full"
      style={{
        transform: `translateX(${virtualColumn.start}px)`,
        width: `${column.size}px`,
      }}
    >
      <column.cell
        value={value}
        rowIndex={rowIndex}
        column={column}
      />
    </div>
  )
}, (prev, next) => prev.virtualColumn.key === next.virtualColumn.key)

const Row = memo(function RowMemo({
  children,
  virtualRow,
}: {
  children: React.ReactNode
  virtualRow: VirtualItem
}) {
  return (
    <div
      data-row-index={virtualRow.index}
      className="group/row absolute flex w-full border-b last:border-b-0 min-w-full hover:bg-accent/30"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translate3d(0,${virtualRow.start}px,0)`,
      }}
    >
      {children}
    </div>
  )
}, (prev, next) => prev.virtualRow.key === next.virtualRow.key)

function RowColumns({ rowIndex }: { rowIndex: number }) {
  const virtualColumns = useTableContext(state => state.virtualColumns)
  const data = useTableContext(state => state.data)
  const columns = useTableContext(state => state.columns)

  return virtualColumns.map((virtualColumn) => {
    const column = columns[virtualColumn.index]
    const value = data[rowIndex][column.name]

    return (
      <RowColumn
        key={virtualColumn.key}
        virtualColumn={virtualColumn}
        value={value}
        rowIndex={rowIndex}
        column={column}
      />
    )
  })
}

export function TableBody() {
  const virtualRows = useTableContext(state => state.virtualRows)
  const rowWidth = useTableContext(state => state.rowWidth)

  return (
    <div
      className="relative flex flex-col"
      style={{ width: `${rowWidth}px` }}
    >
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          virtualRow={virtualRow}
        >
          <RowColumns rowIndex={virtualRow.index} />
        </Row>
      ))}
    </div>
  )
}
