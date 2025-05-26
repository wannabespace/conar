import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { cn } from '@connnect/ui/lib/utils'
import { memo } from 'react'
import { useTableContext } from './provider'

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
  data,
  last,
}: {
  size: number
  rowIndex: number
  virtualColumns: VirtualItem[]
  data?: Record<string, unknown>
  last: boolean
}) {
  const columns = useTableContext(context => context.columns)

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
          value={data?.[columns[virtualColumn.index]?.id]}
          rowIndex={rowIndex}
        />
      ))}
      <div className="w-(--scroll-right-offset) shrink-0" />
    </div>
  )
})

export function TableBody({ rows }: { rows: Record<string, unknown>[] }) {
  const virtualRows = useTableContext(context => context.virtualRows)
  const virtualColumns = useTableContext(context => context.virtualColumns)

  return (
    <div data-mask className="relative w-fit min-w-full">
      <div className="h-(--scroll-top-offset)" />
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          rowIndex={virtualRow.index}
          virtualColumns={virtualColumns}
          data={rows[virtualRow.index]}
          last={virtualRow.index === virtualRows.length - 1}
          size={virtualRow.size}
        />
      ))}
      <div className="h-(--scroll-bottom-offset)" />
    </div>
  )
}
