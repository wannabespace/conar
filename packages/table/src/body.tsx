import { cn } from '@tamery/ui/lib/utils'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties } from 'react'
import { memo } from 'react'

import { useTableContext } from './table-context'
import type { ColumnRenderer } from './types'
import type { ColumnPosition } from './utils'
import { formatCellValue, getBaseColumnStyle, getColumnPosition } from './utils'

const VirtualColumnBase = ({
  virtualColumn,
  column,
  position,
  value,
  rowIndex,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  position: ColumnPosition
  value: unknown
  rowIndex: number
}) => {
  const style = getBaseColumnStyle({ defaultSize: column.size, id: column.id })

  if (!column.cell) {
    // oxlint-disable-next-line shadcn/no-inline-styles -- column widths are a shared style contract with custom cell renderers
    return <div style={style}>{formatCellValue(value)}</div>
  }

  return column.cell({
    columnIndex: virtualColumn.index,
    id: column.id,
    position,
    rowIndex,
    size: virtualColumn.size,
    style,
    value,
  })
}
VirtualColumnBase.displayName = 'VirtualColumn'

const VirtualColumn = memo(VirtualColumnBase)

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
  const row = useTableContext((context) => context.rows[rowIndex])
  const isLast = useTableContext(
    (context) => rowIndex === context.rows.length - 1
  )

  return (
    <div
      className={cn(
        `hover:bg-foreground/6 flex h-(--table-row-height) w-fit min-w-full border-b contain-layout contain-style`,
        (isLast || zebra) && `border-b-0`,
        zebra && rowIndex % 2 === 1 && 'bg-foreground/3'
      )}
      style={{ '--table-row-height': `${size}px` } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="w-(--table-scroll-left-offset) shrink-0 contain-layout contain-size contain-style"
      />
      {virtualColumns.map((virtualColumn) => {
        const column = columns[virtualColumn.index]
        if (!column) {
          return null
        }

        return (
          <VirtualColumn
            key={virtualColumn.key}
            virtualColumn={virtualColumn}
            column={column}
            position={getColumnPosition(virtualColumn.index, columns.length)}
            value={row?.[column.id]}
            rowIndex={rowIndex}
          />
        )
      })}
      <div
        aria-hidden="true"
        className="w-(--table-scroll-right-offset) shrink-0 contain-layout contain-size contain-style"
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
  const tableHeight = useTableContext((context) => context.tableHeight)
  const topOffset = virtualRows[0]?.start ?? 0
  const bottomOffset = tableHeight - (virtualRows.at(-1)?.end ?? 0)

  return (
    <div
      className={cn('relative w-(--table-width) min-w-full', className)}
      style={{ '--table-width': `${tableWidth}px`, ...style } as CSSProperties}
      {...props}
    >
      <div
        aria-hidden="true"
        className="h-(--table-offset) shrink-0 contain-layout contain-size contain-style"
        style={{ '--table-offset': `${topOffset}px` } as CSSProperties}
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
        className="h-(--table-offset) shrink-0 contain-layout contain-size contain-style"
        style={{ '--table-offset': `${bottomOffset}px` } as CSSProperties}
      />
    </div>
  )
}
