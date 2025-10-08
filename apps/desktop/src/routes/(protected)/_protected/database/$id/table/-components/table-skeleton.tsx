/* eslint-disable react/no-array-index-key */
import { cn } from '@conar/ui/lib/utils'
import { useMemo } from 'react'
import { useTableContext } from '~/components/table'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'

const ROWS_COUNT = 20

export function TableBodySkeleton({ className, selectable, columnsCount = 5 }: { className?: string, selectable?: boolean, columnsCount?: number }) {
  const columns = useTableContext(state => state.columns)

  const cols = useMemo(() => {
    if (columns.length === 0) {
      return Array.from({ length: columnsCount }).map((_, index) => ({
        id: `column-${index}`,
        size: DEFAULT_COLUMN_WIDTH,
      }))
    }

    return columns.map(column => ({
      id: column.id,
      size: column.size ?? DEFAULT_COLUMN_WIDTH,
    }))
  }, [columns, columnsCount])

  return (
    <div className={cn('relative w-full', className)}>
      {Array.from({ length: ROWS_COUNT }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex w-fit border-b min-w-full last:border-b-0"
          style={{
            height: `${DEFAULT_ROW_HEIGHT}px`,
            opacity: 1 - (rowIndex * (1 / ROWS_COUNT)),
          }}
        >
          {selectable && (
            <div className="p-2 pl-4 shrink-0">
              <div className="size-4 bg-muted animate-pulse rounded" />
            </div>
          )}
          {cols.map((column, index) => {
            const width = column.size

            return (
              <div
                key={index}
                className="first:pl-4 shrink-0 px-2 py-1 h-full flex items-center"
                style={{
                  width: `${width}px`,
                }}
              >
                <div className="shrink-0 h-4 bg-muted animate-pulse rounded w-3/4" />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
