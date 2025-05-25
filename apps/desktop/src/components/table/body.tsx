import type { VirtualItem } from '@tanstack/react-virtual'
import { memo } from 'react'
import { useTableContext } from '.'

const RowColumn = memo(function RowColumnMemo({
  rowIndex,
  size,
  start,
  index,
}: {
  rowIndex: number
  size: number
  start: number
  index: number
}) {
  const column = useTableContext(state => state.columns[index])
  const value = useTableContext(state => state.data[rowIndex][column.id])

  return (
    <div
      className="absolute top-0 left-0 h-full"
      style={{
        transform: `translateX(${start}px)`,
        width: `${size}px`,
      }}
    >
      <column.cell
        rowIndex={rowIndex}
        columnIndex={index}
        value={value}
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
          size={virtualColumn.size}
          start={virtualColumn.start}
          index={virtualColumn.index}
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
