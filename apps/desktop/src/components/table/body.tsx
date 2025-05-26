import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { cn } from '@connnect/ui/lib/utils'
import { memo } from 'react'

const VirtualColumn = memo(function VirtualColumn({
  virtualColumn,
  column,
  value,
  rowIndex,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  value: unknown
  rowIndex: number
}) {
  return (
    <column.cell
      value={value}
      id={column.id}
      size={virtualColumn.size}
      rowIndex={rowIndex}
      columnIndex={virtualColumn.index}
      style={{
        width: `${column.size}px`,
        height: '100%',
        flexShrink: 0,
      }}
    />
  )
})

const Row = memo(function Row({
  size,
  rowIndex,
  virtualColumns,
  columns,
  data,
  last,
}: {
  size: number
  rowIndex: number
  virtualColumns: VirtualItem[]
  columns: ColumnRenderer[]
  data: Record<string, unknown>
  last: boolean
}) {
  return (
    <div
      className={cn('flex w-fit border-b min-w-full hover:bg-accent/30', last && 'border-b-0')}
      style={{ height: `${size}px` }}
    >
      <div className="w-(--scroll-left-offset) shrink-0" />
      {virtualColumns.map(virtualColumn => (
        <VirtualColumn
          key={virtualColumn.key}
          virtualColumn={virtualColumn}
          column={columns[virtualColumn.index]}
          value={data[columns[virtualColumn.index].id]}
          rowIndex={rowIndex}
        />
      ))}
      <div className="w-(--scroll-right-offset) shrink-0" />
    </div>
  )
})

export const TableBody = memo(function TableBody({
  data,
  virtualRows,
  virtualColumns,
  columns,
}: {
  data: Record<string, unknown>[]
  virtualRows: VirtualItem[]
  virtualColumns: VirtualItem[]
  columns: ColumnRenderer[]
}) {
  return (
    <div data-mask className="relative w-fit min-w-full">
      <div className="h-(--scroll-top-offset)" />
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          rowIndex={virtualRow.index}
          virtualColumns={virtualColumns}
          data={data[virtualRow.index]}
          last={virtualRow.index === virtualRows.length - 1}
          size={virtualRow.size}
          columns={columns}
        />
      ))}
      <div className="h-(--scroll-bottom-offset)" />
    </div>
  )
})
