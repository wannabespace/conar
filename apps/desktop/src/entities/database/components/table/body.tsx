import type { Cell as CellType, Row as RowType } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { flexRender } from '@tanstack/react-table'
import { memo } from 'react'
import { useVirtualColumnsContext } from '.'

const RowCell = memo(function RowCellMemo({
  virtualColumn,
  cell,
}: {
  virtualColumn: VirtualItem
  cell: CellType<Record<string, unknown>, unknown>
}) {
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
})

const RowColumns = memo(function RowColumnsMemo({ row }: { row: RowType<Record<string, unknown>> }) {
  const virtualColumns = useVirtualColumnsContext()

  return virtualColumns.map((virtualColumn) => {
    const cell = row.getVisibleCells()[virtualColumn.index]
    return (
      <RowCell
        key={virtualColumn.key}
        virtualColumn={virtualColumn}
        cell={cell}
      />
    )
  })
})

const Row = memo(function RowMemo({
  virtualRow,
  children,
  rowWidth,
}: {
  virtualRow: VirtualItem
  children: React.ReactNode
  rowWidth: number
}) {
  return (
    <div
      className="group/row flex absolute top-0 left-0 w-full border-b last:border-b-0 min-w-full hover:bg-accent/30"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translate3d(0,${virtualRow.start}px,0)`,
        width: `${rowWidth}px`,
      }}
    >
      {children}
    </div>
  )
})

export const Body = memo(function BodyMemo({
  rows,
  virtualRows,
  rowWidth,
}: {
  rowWidth: number
  rows: RowType<Record<string, unknown>>[]
  virtualRows: VirtualItem[]
}) {
  return (
    <div className="relative flex flex-col">
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          virtualRow={virtualRow}
          rowWidth={rowWidth}
        >
          <RowColumns row={rows[virtualRow.index]} />
        </Row>
      ))}
    </div>
  )
})
