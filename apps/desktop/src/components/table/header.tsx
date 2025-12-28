import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import type { ColumnRenderer } from '.'
import { cn } from '@conar/ui/lib/utils'
import { memo } from 'react'
import { useTableContext } from '.'

const VirtualHeaderColumn = memo(function VirtualHeaderColumn({
  virtualColumn,
  column,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
}) {
  const columns = useTableContext(context => context.columns)

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
      id={column.id}
      columnIndex={virtualColumn.index}
      position={virtualColumn.index === 0
        ? 'first'
        : virtualColumn.index === columns.length - 1
          ? 'last'
          : 'middle'}
      size={virtualColumn.size}
      style={{
        width: `${virtualColumn.size}px`,
        height: '100%',
        flexShrink: 0,
      }}
    />
  )
})

export function TableHeader({
  className,
  style,
  before,
  after,
  ...props
}: ComponentProps<'div'> & {
  before?: ReactNode
  after?: ReactNode
}) {
  const virtualColumns = useTableContext(context => context.virtualColumns)
  const tableWidth = useTableContext(context => context.tableWidth)
  const columns = useTableContext(context => context.columns)
  const spacerStyle: CSSProperties = {
    contain: 'layout style size',
  }

  return (
    <div
      className={cn(`
        sticky top-0 z-10 h-8 w-fit min-w-full border-y bg-background
        has-[[data-footer]]:h-12
      `, className)}
      style={{ width: `${tableWidth}px`, ...style }}
      {...props}
    >
      {before}
      <div className="flex h-full w-fit min-w-full items-center bg-card">
        <div
          aria-hidden="true"
          className={`
            w-(--table-scroll-left-offset) shrink-0 will-change-[height]
          `}
          style={spacerStyle}
        />
        {virtualColumns.map(virtualColumn => (
          <VirtualHeaderColumn
            key={virtualColumn.key}
            virtualColumn={virtualColumn}
            column={columns[virtualColumn.index]!}
          />
        ))}
        <div
          aria-hidden="true"
          className={`
            w-(--table-scroll-right-offset) shrink-0 will-change-[height]
          `}
          style={spacerStyle}
        />
      </div>
      {after}
    </div>
  )
}
