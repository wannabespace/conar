import type { VirtualItem } from '@tanstack/react-virtual'
import type { CSSProperties } from 'react'
import type { ColumnRenderer } from '.'
import { memo } from 'react'
import { useTableContext } from './provider'

const VirtualHeaderColumn = memo(function VirtualHeaderColumn({
  virtualColumn,
  column,
  isLast,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  isLast: boolean
}) {
  return (
    <column.header
      key={virtualColumn.key}
      columnIndex={virtualColumn.index}
      isFirst={virtualColumn.index === 0}
      isLast={isLast}
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
  const spacerStyle: CSSProperties = {
    contain: 'layout style size',
  }

  return (
    <div className="sticky top-0 z-10 border-y bg-background h-8 has-[[data-footer]]:h-12 w-fit min-w-full">
      <div className="flex bg-muted/20 h-full w-fit min-w-full items-center">
        <div
          aria-hidden="true"
          className="shrink-0 w-(--table-scroll-left-offset) will-change-[height]"
          style={spacerStyle}
        />
        {virtualColumns.map(virtualColumn => (
          <VirtualHeaderColumn
            key={virtualColumn.key}
            virtualColumn={virtualColumn}
            column={columns[virtualColumn.index]}
            isLast={virtualColumn.index === virtualColumns.length - 1}
          />
        ))}
        <div
          aria-hidden="true"
          className="shrink-0 w-(--table-scroll-right-offset) will-change-[height]"
          style={spacerStyle}
        />
      </div>
    </div>
  )
}
