/* eslint-disable react/no-array-index-key */
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '.'

export function TableColumnSkeleton() {
  return (
    <div
      className="shrink-0 p-2 h-full"
      style={{
        width: `${DEFAULT_COLUMN_WIDTH}px`,
      }}
    >
      <div className="h-4 bg-muted animate-pulse rounded w-full" />
    </div>
  )
}

export function TableHeaderSkeleton({ columnsCount = 5 }: { columnsCount?: number }) {
  return (
    <div className="sticky top-0 z-10 border-y bg-background h-8 has-[[data-footer]]:h-12 w-fit min-w-full">
      <div className="flex bg-muted/20 h-full w-fit min-w-full items-center">
        {Array.from({ length: columnsCount }).map((_, index) => (
          <TableColumnSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function TableBodySkeleton({ columnsCount = 5 }: { columnsCount?: number }) {
  return (
    <div className="relative w-fit min-w-full">
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex w-fit border-b min-w-full last:border-b-0"
          style={{ height: `${DEFAULT_ROW_HEIGHT}px` }}
        >
          {Array.from({ length: columnsCount }).map((_, index) => (
            <TableColumnSkeleton key={index} />
          ))}
        </div>
      ))}
    </div>
  )
}
