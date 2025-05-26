import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'

const Row = memo(function Row({
  size,
  rowIndex,
  virtualColumns,
  columns,
  data,
}: {
  size: number
  rowIndex: number
  virtualColumns: VirtualItem[]
  columns: ColumnRenderer[]
  data: Record<string, unknown>
}) {
  return (
    <div
      className="flex w-fit border-b last:border-b-0 min-w-full hover:bg-accent/30"
      style={{ height: `${size}px` }}
    >
      <div className="w-(--scroll-left-offset) shrink-0" />
      {virtualColumns.map((virtualColumn) => {
        const column = columns[virtualColumn.index]
        const value = data?.[column.id]

        return (
          <column.cell
            key={virtualColumn.key}
            rowIndex={rowIndex}
            columnIndex={virtualColumn.index}
            value={value}
            style={{
              width: `${column.size}px`,
              height: '100%',
              flexShrink: 0,
            }}
          />
        )
      })}
      <div className="w-(--scroll-right-offset) shrink-0" />
    </div>
  )
})

export function TableBody({
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
          size={virtualRow.size}
          columns={columns}
        />
      ))}
      <div className="h-(--scroll-bottom-offset)" />
    </div>
  )
}
