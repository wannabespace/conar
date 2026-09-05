import { cn } from '@tamery/ui/lib/utils'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties } from 'react'
import { memo } from 'react'

import type { ColumnRenderer } from './'
import { useTableContext } from './table-context'
import { getBaseColumnStyle, getColumnPosition } from './utils'

const VirtualColumnBase = ({
  virtualColumn,
  column,
  value,
  rowIndex,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  value: unknown
  rowIndex: number
}) => {
  const columnsLength = useTableContext((context) => context.columns.length)

  if (!column.cell) {
    return (
      <div
        style={getBaseColumnStyle({
          defaultSize: column.size,
          id: column.id,
        })}
      >
        {String(value)}
      </div>
    )
  }

  return column.cell({
    columnIndex: virtualColumn.index,
    id: column.id,
    position: getColumnPosition(virtualColumn.index, columnsLength),
    rowIndex,
    size: virtualColumn.size,
    style: getBaseColumnStyle({ defaultSize: column.size, id: column.id }),
    value,
  })
}
VirtualColumnBase.displayName = 'VirtualColumn'

const VirtualColumn = memo(VirtualColumnBase)

const spacerStyle: CSSProperties = {
  contain: 'layout style size',
}

const RowBase = ({
  size,
  rowIndex,
  zebra,
}: {
  size: number
  rowIndex: number
  zebra?: boolean
}) => {
  const columns = useTableContext((context) => context.columns)
  const virtualColumns = useTableContext((context) => context.virtualColumns)
  const rows = useTableContext((context) => context.rows)
  const row = rows[rowIndex]
  const lastIndex = rows.length - 1

  return (
    <div
      className={cn(
        `hover:bg-foreground/6 flex w-fit min-w-full border-b`,
        rowIndex === lastIndex && `border-b-0`,
        zebra && 'border-b-0',
        zebra && rowIndex % 2 === 1 && 'bg-foreground/3'
      )}
      style={{ contain: 'layout style', height: `${size}px` }}
    >
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
        const value = row?.[column.id]

        return (
          <VirtualColumn
            key={virtualColumn.key}
            virtualColumn={virtualColumn}
            column={column}
            value={value}
            rowIndex={rowIndex}
          />
        )
      })}
      <div
        aria-hidden="true"
        className="w-(--table-scroll-right-offset) shrink-0 will-change-[height]"
        style={spacerStyle}
      />
    </div>
  )
}
RowBase.displayName = 'Row'

const Row = memo(RowBase)

export const TableBody = ({
  className,
  style,
  zebra,
  ...props
}: ComponentProps<'div'> & { zebra?: boolean }) => {
  const virtualRows = useTableContext((context) => context.virtualRows)
  const tableWidth = useTableContext((context) => context.tableWidth)

  return (
    <div
      className={cn('relative min-w-full', className)}
      style={{ width: `${tableWidth}px`, ...style }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="h-(--table-scroll-top-offset) shrink-0 will-change-[height]"
        style={spacerStyle}
      />
      {virtualRows.map((virtualRow) => (
        <Row
          key={virtualRow.key}
          rowIndex={virtualRow.index}
          size={virtualRow.size}
          zebra={zebra}
        />
      ))}
      <div
        aria-hidden="true"
        className="h-(--table-scroll-bottom-offset) shrink-0 will-change-[height]"
        style={spacerStyle}
      />
    </div>
  )
}
