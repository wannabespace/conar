import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'

const VirtualHeaderColumn = memo(function VirtualHeaderColumn({
  virtualColumn,
  column,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
}) {
  return (
    <column.header
      key={virtualColumn.key}
      columnIndex={virtualColumn.index}
      style={{
        width: `${column.size}px`,
        height: '100%',
        flexShrink: 0,
      }}
    />
  )
})

export const TableHeader = memo(function TableHeader({
  columns,
  virtualColumns,
}: {
  columns: ColumnRenderer[]
  virtualColumns: VirtualItem[]
}) {
  return (
    <div className="sticky top-0 z-10 border-y bg-background h-8 has-[[data-type]]:h-12 w-fit min-w-full">
      <div className="flex bg-muted/20 w-fit min-w-full items-center">
        <div className="shrink-0 w-(--scroll-left-offset)" />
        {virtualColumns.map(virtualColumn => (
          <VirtualHeaderColumn
            key={virtualColumn.key}
            virtualColumn={virtualColumn}
            column={columns[virtualColumn.index]}
          />
        ))}
        <div className="shrink-0 w-(--scroll-right-offset)" />
      </div>
    </div>
  )
})
