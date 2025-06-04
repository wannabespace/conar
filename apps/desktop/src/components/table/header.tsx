import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties } from 'react'
import type { ColumnRenderer } from '.'
import { cn } from '@connnect/ui/lib/utils'
import { memo } from 'react'
import { useTableContext } from '.'

const VirtualHeaderColumn = memo(function VirtualHeaderColumn({
  virtualColumn,
  column,
  isLast,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  isLast: boolean
}) {
  if (!column.header) {
    return (
      <div
        style={{
          width: `${virtualColumn.size}px`,
          height: '100%',
          flexShrink: 0,
        }}
      >
        {column.id}
      </div>
    )
  }

  return (
    <column.header
      key={virtualColumn.key}
      columnIndex={virtualColumn.index}
      isFirst={virtualColumn.index === 0}
      isLast={isLast}
      size={virtualColumn.size}
      style={{
        width: `${virtualColumn.size}px`,
        height: '100%',
        flexShrink: 0,
      }}
    />
  )
})

export function TableHeader({ className, style, ...props }: ComponentProps<'div'>) {
  const virtualColumns = useTableContext(context => context.virtualColumns)
  const tableWidth = useTableContext(context => context.tableWidth)
  const columns = useTableContext(context => context.columns)
  const spacerStyle: CSSProperties = {
    contain: 'layout style size',
  }

  return (
    <div
      className={cn('sticky top-0 z-10 border-y bg-background h-8 has-[[data-footer]]:h-12 w-fit min-w-full', className)}
      style={{ width: `${tableWidth}px`, ...style }}
      {...props}
    >
      <div className="flex bg-muted/30 h-full w-fit min-w-full items-center">
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
            isLast={virtualColumn.index === columns.length - 1}
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
