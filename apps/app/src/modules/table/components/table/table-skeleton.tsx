/* oxlint-disable react/no-array-index-key -- static placeholders */
import { pseudoRandom } from '@tamery/shared/utils'
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  LEADING_COLUMN_SIZE,
} from '@tamery/table/constants'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

import {
  DOCUMENT_HEADER_CLASS,
  DOCUMENT_ITEM_CLASS,
  FIELD_ROW_CLASS,
} from '~/core/table/document-list'

const ROWS = 20
const COLUMNS = 6
const STAGGER_MS = 90
const DOCUMENTS = 4
const FIELDS = 6

const barWidth = (row: number, column: number) => {
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
    {/* Keep in step with the grid's `GUTTER`. */}
    <div aria-hidden className="w-2 shrink-0" />
    {selectable && (
      <div className="flex w-(--leading-width) shrink-0 items-center justify-end border-r pr-3">
        <Skeleton className="size-4 rounded-md [animation-delay:var(--row-delay)]" />
      </div>
    )}
    {Array.from({ length: COLUMNS }, (_, column) => (
      <div
        key={column}
        className="flex w-(--column-width) shrink-0 flex-col justify-center gap-1.5 border-r px-2"
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
        className="flex h-(--row-height) border-b opacity-(--row-opacity) [animation-delay:var(--row-delay)]"
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
              style={{ '--bar-width': barWidth(row, column) } as CSSProperties}
            />
          )}
        </Columns>
      </div>
    ))}
  </div>
)

export const DocumentsSkeleton = ({ selectable }: { selectable: boolean }) => (
  <div aria-hidden className="size-full overflow-hidden">
    {Array.from({ length: DOCUMENTS }, (_, document) => (
      <div key={document} data-index={document} className={DOCUMENT_ITEM_CLASS}>
        <div className={DOCUMENT_HEADER_CLASS}>
          {selectable && <Skeleton className="mr-2 -ml-1 size-4 rounded-md" />}
          <Skeleton className="h-2.5 w-12" />
        </div>
        {Array.from({ length: FIELDS }, (__, field) => (
          <div
            key={field}
            className={cn(
              'flex h-8 items-center gap-4',
              FIELD_ROW_CLASS,
              'px-4'
            )}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton
              className="h-3.5 w-(--bar-width)"
              style={
                { '--bar-width': barWidth(document, field) } as CSSProperties
              }
            />
          </div>
        ))}
      </div>
    ))}
  </div>
)
