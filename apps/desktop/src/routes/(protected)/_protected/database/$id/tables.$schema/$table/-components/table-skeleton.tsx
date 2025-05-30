/* eslint-disable react/no-array-index-key */
import { cn } from '@connnect/ui/lib/utils'
import { useMemo } from 'react'
import { useTableContext } from '~/components/table'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'

export function TableHeaderSkeleton({ className, selectable, columnsCount = 5 }: { className?: string, selectable?: boolean, columnsCount?: number }) {
  return (
    <div className={cn('sticky top-0 z-10 border-y bg-background h-12 w-fit min-w-full', className)}>
      <div className="flex bg-muted/20 h-full w-fit min-w-full items-center">
        {selectable && (
          <div className="p-2 pl-4">
            <div className="size-4 bg-muted animate-pulse rounded" />
          </div>
        )}
        {Array.from({ length: columnsCount }).map((_, index) => (
          <div
            key={index}
            className="first:pl-4 shrink-0 px-2 py-1 h-full flex justify-between items-center"
            style={{
              width: `${DEFAULT_COLUMN_WIDTH}px`,
            }}
          >
            <div className="flex-1 shrink-0 w-full flex flex-col gap-1">
              <div className="shrink-0 h-4 bg-muted animate-pulse rounded w-2/3" />
              <div className="flex items-center gap-1">
                {index === 0 && <div className="size-3 bg-muted animate-pulse rounded" />}
                <div className="shrink-0 w-1/2 h-4 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="shrink-0">
              <div className="bg-muted size-4 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  }, [columns])

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
