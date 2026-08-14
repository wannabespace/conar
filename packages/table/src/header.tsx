import { cn } from '@tamery/ui/lib/utils'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { memo } from 'react'

import type { ColumnRenderer } from './'
import { useTableContext } from './table-context'
import { getBaseColumnStyle } from './utils'

const getHeaderPosition = (
  index: number,
  columnCount: number
): 'first' | 'last' | 'middle' => {
  if (index === 0) {
    return 'first'
  }
  if (index === columnCount - 1) {
    return 'last'
  }
  return 'middle'
}

// oxlint-disable-next-line prefer-arrow-callback -- memo needs a named function for displayName
const VirtualHeaderColumn = memo(function VirtualHeaderColumn({
  virtualColumn,
  column,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
}) {
  const columns = useTableContext((context) => context.columns)

  if (!column.header) {
    return (
      <div
        style={getBaseColumnStyle({
          defaultSize: column.size,
          id: column.id,
        })}
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
      position={getHeaderPosition(virtualColumn.index, columns.length)}
      size={virtualColumn.size}
      style={getBaseColumnStyle({ defaultSize: column.size, id: column.id })}
    />
  )
})

const spacerStyle: CSSProperties = {
  contain: 'layout style size',
}

export const TableHeader = ({
  className,
  style,
  before,
  after,
  ...props
}: ComponentProps<'div'> & {
  before?: ReactNode
  after?: ReactNode
}) => {
  const virtualColumns = useTableContext((context) => context.virtualColumns)
  const tableWidth = useTableContext((context) => context.tableWidth)
  const columns = useTableContext((context) => context.columns)

  return (
    <div
      className={cn(
        `bg-background inset-ring-border sticky top-0 z-10 w-fit min-w-full rounded-lg inset-ring`,
        className
      )}
      style={{ width: `${tableWidth}px`, ...style }}
      {...props}
    >
      {before}
      <div className="flex w-fit min-w-full items-center">
        <div
          aria-hidden="true"
          className="w-(--table-scroll-left-offset) shrink-0 will-change-[height]"
          style={spacerStyle}
        />
        {virtualColumns.map((virtualColumn) => {
          const column = columns[virtualColumn.index]
          if (!column) {
            return null
          }
          return (
            <VirtualHeaderColumn
              key={virtualColumn.key}
              virtualColumn={virtualColumn}
              column={column}
            />
          )
        })}
        <div
          aria-hidden="true"
          className="w-(--table-scroll-right-offset) shrink-0 will-change-[height]"
          style={spacerStyle}
        />
      </div>
      {after}
    </div>
  )
}
