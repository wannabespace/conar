import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, useTableContext } from '.'

export function TableSkeleton() {
  const columnsCount = useTableContext(state => state.columns.length) || 5

  return (
    <div className="relative flex flex-col">
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={rowIndex}
          className="flex absolute top-0 left-0 w-full border-b last:border-b-0 min-w-full border-border"
          style={{
            height: `${DEFAULT_ROW_HEIGHT}px`,
            transform: `translate3d(0,${rowIndex * DEFAULT_ROW_HEIGHT}px,0)`,
          }}
        >
          {Array.from({ length: columnsCount }).map((_, index) => (
            <div
              key={index}
              className="group absolute top-0 left-0 h-full"
              style={{
                transform: `translateX(${index * DEFAULT_COLUMN_WIDTH}px)`,
                width: `${DEFAULT_COLUMN_WIDTH}px`,
              }}
            >
              <div className="shrink-0 text-xs truncate p-2 group-first:pl-4 group-last:pr-4 h-full">
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
