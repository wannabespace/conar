/* eslint-disable react/no-array-index-key */
import { cn } from '@connnect/ui/lib/utils'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/components/table'

export function TableHeaderSkeleton({ className, columnsCount = 5 }: { className?: string, columnsCount?: number }) {
  return (
    <div className={cn('sticky top-0 z-10 border-y bg-background h-12 w-fit min-w-full', className)}>
      <div className="flex bg-muted/20 h-full w-fit min-w-full items-center">
        <div className="p-2 pl-4">
          <div className="size-4 bg-muted animate-pulse rounded" />
        </div>
        {Array.from({ length: columnsCount }).map((_, index) => (
          <div
            key={index}
            className="shrink-0 px-2 py-1 h-full flex justify-between items-center"
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

export function TableBodySkeleton({ className, columnsCount = 5 }: { className?: string, columnsCount?: number }) {
  return (
    <div className={cn('relative w-full', className)}>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex w-fit border-b min-w-full last:border-b-0"
          style={{ height: `${DEFAULT_ROW_HEIGHT}px` }}
        >
          <div className="p-2 pl-4">
            <div className="size-4 bg-muted animate-pulse rounded" />
          </div>
          {Array.from({ length: columnsCount }).map((_, index) => (
            <div
              key={index}
              className="shrink-0 px-2 py-1 h-full flex items-center"
              style={{
                width: `${DEFAULT_COLUMN_WIDTH}px`,
              }}
            >
              <div className="shrink-0 h-4 bg-muted animate-pulse rounded w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
