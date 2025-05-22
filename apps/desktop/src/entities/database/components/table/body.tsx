import type { VirtualItem } from '@tanstack/react-virtual'
import { memo } from 'react'
import { useTableContext } from '.'

const RowColumn = memo(function RowColumnMemo({
  rowIndex,
  virtualColumn,
}: {
  rowIndex: number
  virtualColumn: VirtualItem
}) {
  const data = useTableContext(state => state.data)
  const columns = useTableContext(state => state.columns)

  const column = columns[virtualColumn.index]
  const value = data[rowIndex][column.id]

  return (
    <div
      className="absolute top-0 left-0 h-full"
      style={{
        transform: `translateX(${virtualColumn.start}px)`,
        width: `${column.size}px`,
      }}
    >
      <column.cell
        value={value}
        rowIndex={rowIndex}
        column={column}
        index={virtualColumn.index}
      />
    </div>
  )
})

const Row = memo(function RowMemo({
  size,
  start,
  rowIndex,
  virtualColumns,
}: {
  size: number
  start: number
  rowIndex: number
  virtualColumns: VirtualItem[]
}) {
  return (
    <div
      className="absolute w-full border-b last:border-b-0 min-w-full hover:bg-accent/30"
      style={{
        height: `${size}px`,
        transform: `translate3d(0,${start}px,0)`,
      }}
    >
      {virtualColumns.map(virtualColumn => (
        <RowColumn
          key={virtualColumn.key}
          virtualColumn={virtualColumn}
          rowIndex={rowIndex}
        />
      ))}
    </div>
  )
})

export function TableBody() {
  const virtualRows = useTableContext(state => state.virtualRows)
  const rowWidth = useTableContext(state => state.rowWidth)
  const virtualColumns = useTableContext(state => state.virtualColumns)

  return (
    <div
      className="relative"
      style={{ width: `${rowWidth}px` }}
    >
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          size={virtualRow.size}
          start={virtualRow.start}
          rowIndex={virtualRow.index}
          virtualColumns={virtualColumns}
        />
      ))}
    </div>
  )
}
