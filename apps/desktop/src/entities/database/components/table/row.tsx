import type { Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { flexRender } from '@tanstack/react-table'

export function TableRow<T extends Record<string, unknown>>({ row, virtualRow, virtualColumns, rowWidth }: {
  row: Row<T>
  virtualRow: VirtualItem
  virtualColumns: VirtualItem[]
  rowWidth: number
}) {
  'use no memo'
  return (
    <div
      className="group/row flex absolute top-0 left-0 w-full border-b last:border-b-0 min-w-full border-border hover:bg-accent/30"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translate3d(0,${virtualRow.start}px,0)`,
        width: `${rowWidth}px`,
      }}
    >
      {virtualColumns.map((virtualColumn) => {
        const cell = row.getVisibleCells()[virtualColumn.index]
        return (
          <div
            key={virtualColumn.key}
            className="group/cell absolute top-0 left-0 h-full"
            style={{
              transform: `translateX(${virtualColumn.start}px)`,
              width: `${cell.column.getSize()}px`,
            }}
          >
            {flexRender(
              cell.column.columnDef.cell,
              cell.getContext(),
            )}
          </div>
        )
      })}
    </div>
  )
}
