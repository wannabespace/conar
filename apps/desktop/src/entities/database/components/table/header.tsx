import type { ColumnRenderer } from '.'
import { memo } from 'react'
import { useTableContext } from '.'

const HeaderColumn = memo(function HeaderColumnMemo({
  column,
  index,
  start,
}: {
  column: ColumnRenderer
  index: number
  start: number
}) {
  return (
    <div
      className="absolute top-0 left-0 flex h-full"
      style={{
        transform: `translateX(${start}px)`,
        width: `${column.size}px`,
      }}
    >
      <column.header column={column} index={index} />
    </div>
  )
})

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
                key={column.id}
                column={column}
                index={virtualColumn.index}
                start={virtualColumn.start}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
