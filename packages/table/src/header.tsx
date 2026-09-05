import { cn } from '@tamery/ui/lib/utils'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { memo } from 'react'

import type { ColumnRenderer } from './'
import { useTableContext } from './table-context'
import type { ColumnPosition } from './utils'
import { getBaseColumnStyle, getColumnPosition } from './utils'

const HeaderCellBase = ({
  virtualColumn,
  column,
  position,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  position: ColumnPosition
}) => {
  const style = getBaseColumnStyle({ defaultSize: column.size, id: column.id })

  if (!column.header) {
    return <div style={style}>{column.id}</div>
  }

  return column.header({
    columnIndex: virtualColumn.index,
    id: column.id,
    position,
    size: virtualColumn.size,
    style,
  })
}
HeaderCellBase.displayName = 'HeaderCell'

const HeaderCell = memo(HeaderCellBase)

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
          className="w-(--table-scroll-left-offset) shrink-0"
          style={spacerStyle}
        />
        {virtualColumns.map((virtualColumn) => {
          const column = columns[virtualColumn.index]
          if (!column) {
            return null
          }
          return (
            <HeaderCell
              key={virtualColumn.key}
              virtualColumn={virtualColumn}
              column={column}
              position={getColumnPosition(virtualColumn.index, columns.length)}
            />
          )
        })}
        <div
          aria-hidden="true"
          className="w-(--table-scroll-right-offset) shrink-0"
          style={spacerStyle}
        />
      </div>
      {after}
    </div>
  )
}
