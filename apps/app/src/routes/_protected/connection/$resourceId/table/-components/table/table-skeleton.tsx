/* oxlint-disable react/no-array-index-key */
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '@tamery/table/constants'
import { useTableContext } from '@tamery/table/hooks'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'

import { INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'

const ROWS_COUNT = 20
const STAGGER_MS = 90

function pseudoRandom(seed: number) {
  return Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1
}

function barWidth(rowIndex: number, columnIndex: number) {
  const base = 30 + pseudoRandom(columnIndex + 1) * 50
  const jitter = (pseudoRandom(rowIndex * 31 + columnIndex * 7) - 0.5) * 44
  return Math.round(Math.min(95, Math.max(15, base + jitter)))
}

export function TableHeaderSkeleton({
  selectable,
  columnsCount = 6,
}: {
  selectable?: boolean
  columnsCount?: number
}) {
  return (
    <div
      className="
        sticky top-0 z-10 flex w-fit min-w-full items-center bg-background
        inset-shadow-[0_-1px_0_0_var(--color-border)]
      "
    >
      {selectable && (
        <div className="shrink-0 p-2 pl-4">
          <Skeleton className="size-4 rounded-sm" />
        </div>
      )}
      {Array.from({ length: columnsCount }).map((_, columnIndex) => (
        <div
          // oxlint-disable-next-line react/no-array-index-key
          key={columnIndex}
          className="flex shrink-0 flex-col justify-center p-2 first:pl-4"
          style={{ width: `${DEFAULT_COLUMN_WIDTH}px` }}
        >
          <div className="flex h-4 items-center">
            <Skeleton
              className="h-3 rounded-md"
              style={{ width: `${25 + pseudoRandom(columnIndex + 40) * 35}%` }}
            />
          </div>
          <div className="flex h-4 items-center">
            <Skeleton
              className="h-2.5 rounded-md"
              style={{ width: `${15 + pseudoRandom(columnIndex + 80) * 15}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableBodySkeleton({
  className,
  selectable,
  columnsCount = 6,
}: {
  className?: string
  selectable?: boolean
  columnsCount?: number
}) {
  const columns = useTableContext(state => state.columns)
  const columnsWithoutInternal = columns.filter(
    column => !Object.values(INTERNAL_COLUMN_IDS).includes(column.id),
  )

  const cols =
    columnsWithoutInternal.length === 0
      ? Array.from({ length: columnsCount }).map((_, index) => ({
          id: `column-${index + 1}`,
          size: DEFAULT_COLUMN_WIDTH,
        }))
      : columnsWithoutInternal.map(column => ({
          id: column.id,
          size: column.size ?? DEFAULT_COLUMN_WIDTH,
        }))

  return (
    <div aria-hidden className={cn('relative w-full', className)}>
      {Array.from({ length: ROWS_COUNT }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'flex w-fit min-w-full items-center',
            rowIndex % 2 === 1 && 'bg-foreground/3',
          )}
          style={{
            height: `${DEFAULT_ROW_HEIGHT}px`,
            opacity: 1 - rowIndex / ROWS_COUNT,
          }}
        >
          {selectable && (
            <div className="shrink-0 p-2 pl-4">
              <Skeleton
                className="size-4 rounded-sm"
                style={{ animationDelay: `${rowIndex * STAGGER_MS}ms` }}
              />
            </div>
          )}
          {cols.map((column, columnIndex) => (
            <div
              key={column.id}
              className={`
                flex h-full shrink-0 items-center px-2
                first:pl-4
              `}
              style={{ width: `${column.size}px` }}
            >
              <Skeleton
                className="h-3.5 rounded-md"
                style={{
                  width: `${barWidth(rowIndex, columnIndex)}%`,
                  animationDelay: `${rowIndex * STAGGER_MS}ms`,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
