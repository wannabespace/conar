import type { VirtualItem } from '@tanstack/react-virtual'
import type { ColumnRenderer } from '.'
import { memo } from 'react'
import { useTableContext } from '.'

const HeaderColumn = memo(function HeaderColumnMemo({ column, virtualColumn }: { column: ColumnRenderer, virtualColumn: VirtualItem }) {
  return (
    <div
      data-column-index={virtualColumn.index}
      className="group/header absolute top-0 left-0 flex h-full"
      style={{
        transform: `translateX(${virtualColumn.start}px)`,
        width: `${column.size}px`,
      }}
    >
      <column.header column={column} />
    </div>
  )
}, (prev, next) => prev.virtualColumn.key === next.virtualColumn.key)

export function TableHeader({ columns }: { columns: ColumnRenderer[] }) {
  const virtualColumns = useTableContext(state => state.virtualColumns)
  const rowWidth = useTableContext(state => state.rowWidth)

  return (
    <div className="sticky top-0 z-10 border-y bg-background">
      <div className="bg-muted/20">
        <div className="flex h-8 has-[[data-type]]:h-12" style={{ width: `${rowWidth}px` }}>
          {virtualColumns.map((virtualColumn) => {
            const column = columns[virtualColumn.index]

            return (
              <HeaderColumn
                key={column.name}
                column={column}
                virtualColumn={virtualColumn}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
