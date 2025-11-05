import type { VirtualItem } from '@tanstack/react-virtual'
import type { ComponentProps, CSSProperties } from 'react'
import type { ColumnRenderer } from '.'
import { cn } from '@conar/ui/lib/utils'
import { memo } from 'react'
import { useTableContext } from '.'

const VirtualColumn = memo(function VirtualColumn({
  virtualColumn,
  column,
  value,
  rowIndex,
}: {
  virtualColumn: VirtualItem
  column: ColumnRenderer
  value: unknown
  rowIndex: number
}) {
  const columnsLength = useTableContext(context => context.columns.length)

  if (!column.cell) {
    return (
      <div
        style={{
          width: `${virtualColumn.size}px`,
          height: '100%',
          flexShrink: 0,
        }}
      >
        {String(value)}
      </div>
    )
  }

  return (
    <column.cell
      value={value}
      id={column.id}
      size={virtualColumn.size}
      rowIndex={rowIndex}
      columnIndex={virtualColumn.index}
      position={virtualColumn.index === 0
        ? 'first'
        : virtualColumn.index === columnsLength - 1
          ? 'last'
          : 'middle'}
      style={{
        width: `${virtualColumn.size}px`,
        height: '100%',
        flexShrink: 0,
      }}
    />
  )
})

const spacerStyle: CSSProperties = {
  contain: 'layout style size',
}

const Row = memo(function Row({
  size,
  rowIndex,
}: {
  size: number
  rowIndex: number
}) {
  const columns = useTableContext(context => context.columns)
  const virtualColumns = useTableContext(context => context.virtualColumns)
  const rows = useTableContext(context => context.rows)
  const row = rows[rowIndex]
  const lastIndex = rows.length - 1

  return (
    <div
      className={cn('flex w-fit border-b min-w-full hover:bg-accent/30', rowIndex === lastIndex && 'border-b-0')}
      style={{ height: `${size}px`, contain: 'layout style' }}
    >
      <div
        aria-hidden="true"
        className="w-(--table-scroll-left-offset) will-change-[height] shrink-0"
        style={spacerStyle}
      />
      {virtualColumns.map((virtualColumn) => {
        const column = columns[virtualColumn.index]!
        const value = row?.[column?.id]

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
        className="w-(--table-scroll-right-offset) will-change-[height] shrink-0"
        style={spacerStyle}
      />
    </div>
  )
})

export function TableBody({ className, style, ...props }: ComponentProps<'div'>) {
  const virtualRows = useTableContext(context => context.virtualRows)
  const tableWidth = useTableContext(context => context.tableWidth)

  return (
    <div
      className={cn('relative w-fit min-w-full', className)}
      style={{ width: `${tableWidth}px`, ...style }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="h-(--table-scroll-top-offset) will-change-[height] shrink-0"
        style={spacerStyle}
      />
      {virtualRows.map(virtualRow => (
        <Row
          key={virtualRow.key}
          rowIndex={virtualRow.index}
          size={virtualRow.size}
        />
      ))}
      <div
        aria-hidden="true"
        className="h-(--table-scroll-bottom-offset) will-change-[height] shrink-0"
        style={spacerStyle}
      />
    </div>
  )
}
