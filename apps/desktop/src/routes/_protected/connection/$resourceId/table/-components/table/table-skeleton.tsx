/* eslint-disable react/no-array-index-key */
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '@conar/table/constants'
import { useTableContext } from '@conar/table/hooks'
import { cn } from '@conar/ui/lib/utils'
import { INTERNAL_COLUMN_IDS } from '~/entities/connection/components'

const ROWS_COUNT = 20

export function TableBodySkeleton({ className, selectable, columnsCount = 6 }: { className?: string, selectable?: boolean, columnsCount?: number }) {
  const columns = useTableContext(state => state.columns)
  const columnsWithoutInternal = columns.filter(column => !Object.values(INTERNAL_COLUMN_IDS).includes(column.id))

  const cols = columnsWithoutInternal.length === 0
    ? Array.from({ length: columnsCount }).map((_, index) => ({
        id: `column-${index + 1}`,
        size: DEFAULT_COLUMN_WIDTH,
      }))
    : columns.map(column => ({
        id: column.id,
        size: column.size ?? DEFAULT_COLUMN_WIDTH,
      }))

  return (
    <div className={cn('relative w-full', className)}>
      {Array.from({ length: ROWS_COUNT }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`
            flex w-fit min-w-full border-b
            last:border-b-0
          `}
          style={{
            height: `${DEFAULT_ROW_HEIGHT}px`,
            opacity: 1 - (rowIndex * (1 / ROWS_COUNT)),
          }}
        >
          {selectable && (
            <div className="shrink-0 p-2 pl-4">
              <div className="size-4 animate-pulse rounded-sm bg-muted" />
            </div>
          )}
          {cols.map((column, index) => (
            <div
              key={index}
              className={`
                flex h-full shrink-0 items-center px-2 py-1
                first:pl-4
              `}
              style={{
                width: `${column.size}px`,
              }}
            >
              <div className={`
                h-4 w-full shrink-0 animate-pulse rounded-sm bg-muted
              `}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
