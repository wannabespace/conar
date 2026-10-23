import { pseudoRandom } from '@tamery/shared/utils'
import { Skeleton } from '@tamery/ui/components/skeleton'
import type { CSSProperties, ReactNode } from 'react'

import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  GUTTER_WIDTH,
  LEADING_COLUMN_SIZE,
} from './constants'

const ROWS = 20
const COLUMNS = 6
const STAGGER_MS = 90

export const skeletonBarWidth = (row: number, column: number) => {
  const base = 30 + pseudoRandom(column + 1) * 50
  const jitter = (pseudoRandom(row * 31 + column * 7) - 0.5) * 44
  return `${Math.round(Math.min(95, Math.max(15, base + jitter)))}%`
}

const Columns = ({
  children,
  selectable,
}: {
  children: (column: number) => ReactNode
  selectable: boolean
}) => (
  <>
    <div className="w-(--gutter-width) shrink-0" />
    {selectable && (
      <div className="flex w-(--leading-width) shrink-0 items-center justify-end border-r pr-3">
        <Skeleton className="size-4 [animation-delay:var(--row-delay)]" />
      </div>
    )}
    {Array.from({ length: COLUMNS }, (_, column) => (
      <div
        key={column}
        className="flex w-(--column-width) shrink-0 flex-col justify-center border-r px-2"
      >
        {children(column)}
      </div>
    ))}
  </>
)

export const TableSkeleton = ({ selectable }: { selectable: boolean }) => (
  <div
    aria-hidden
    className="size-full overflow-hidden"
    style={
      {
        '--column-width': `${DEFAULT_COLUMN_WIDTH}px`,
        '--gutter-width': `${GUTTER_WIDTH}px`,
        '--leading-width': `${LEADING_COLUMN_SIZE}px`,
        '--row-height': `${DEFAULT_ROW_HEIGHT}px`,
      } as CSSProperties
    }
  >
    <div className="flex h-8 border-b">
      <Columns selectable={selectable}>
        {(column) => (
          <Skeleton
            className="h-3 w-(--bar-width)"
            style={
              {
                '--bar-width': `${25 + pseudoRandom(column + 40) * 35}%`,
              } as CSSProperties
            }
          />
        )}
      </Columns>
    </div>
    {Array.from({ length: ROWS }, (_, row) => (
      <div
        key={row}
        className="flex h-(--row-height) border-b opacity-(--row-opacity)"
        style={
          {
            '--row-delay': `${row * STAGGER_MS}ms`,
            '--row-opacity': 1 - row / ROWS,
          } as CSSProperties
        }
      >
        <Columns selectable={selectable}>
          {(column) => (
            <Skeleton
              className="h-3.5 w-(--bar-width) [animation-delay:var(--row-delay)]"
              style={
                {
                  '--bar-width': skeletonBarWidth(row, column),
                } as CSSProperties
              }
            />
          )}
        </Columns>
      </div>
    ))}
  </div>
)
