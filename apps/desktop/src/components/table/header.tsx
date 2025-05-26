import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'

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
        {virtualColumns.map((virtualColumn) => {
          const column = columns[virtualColumn.index]

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
        })}
        <div className="shrink-0 w-(--scroll-right-offset)" />
      </div>
    </div>
  )
})
