import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'
import { useTableContext } from './provider'

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

export function TableHeader() {
  const virtualColumns = useTableContext(context => context.virtualColumns)
  const columns = useTableContext(context => context.columns)

  return (
    <div className="sticky top-0 z-10 border-y bg-background h-8 has-[[data-footer]]:h-12 w-fit min-w-full">
      <div className="flex bg-muted/20 h-full w-fit min-w-full items-center">
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
}
