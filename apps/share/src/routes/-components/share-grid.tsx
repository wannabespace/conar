/* oxlint-disable jsx-a11y/prefer-tag-over-role -- the app's virtualized flex grid cannot be built from table elements */
import { ArrowDown02Icon, ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ColumnKind } from '@tamery/shared/column-kind'
import type { GridRow } from '@tamery/table'
import {
  ARIA_SORT,
  getColumnSize,
  Grid,
  HEADER_ROW,
  useGridNavigation,
} from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { ColumnKindIcon } from '@tamery/ui/components/custom/column-kind-icon'
import { cn } from '@tamery/ui/lib/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useRef } from 'react'

import { posthog } from '~/lib/posthog'
import type { shareSearch } from '~/lib/share-rows'

type ShareSearch = typeof shareSearch.infer

const CURSOR_CLASS =
  'pointer-events-none absolute inset-0 group-focus-within/grid:inset-ring-3 group-focus-within/grid:inset-ring-ring/50'

const nextSort = (
  current: ShareSearch,
  column: string,
  ownerSort: ShareSearch
): ShareSearch => {
  if (current.sort === column && current.order === 'DESC' && !ownerSort.sort) {
    return {}
  }
  const next = {
    order:
      current.sort === column && current.order === 'ASC'
        ? ('DESC' as const)
        : ('ASC' as const),
    sort: column,
  }
  return next.sort === ownerSort.sort && next.order === ownerSort.order
    ? {}
    : next
}

export const ShareGrid = ({
  columns,
  footer,
  isFetching,
  onEndReached,
  orderBy,
  rows,
  search,
}: {
  columns: { id: string; kind: ColumnKind; type: string | null }[]
  footer: ReactNode
  isFetching: boolean
  onEndReached: () => void
  orderBy: Record<string, 'ASC' | 'DESC'>
  rows: GridRow[]
  search: ShareSearch
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const kinds = new Map(columns.map(({ id, kind }) => [id, kind]))
  const gridColumns = columns.map((column) => ({
    id: column.id,
    size: getColumnSize(column.type),
  }))
  const [ownerColumn, ownerDirection] = Object.entries(orderBy)[0] ?? []
  const ownerSort: ShareSearch = ownerColumn
    ? { order: ownerDirection, sort: ownerColumn }
    : {}
  const current: ShareSearch = search.sort
    ? { order: search.order ?? 'ASC', sort: search.sort }
    : ownerSort
  const getSort = (column: string) => {
    if (search.sort) {
      return current.sort === column ? current.order : null
    }
    return orderBy[column] ?? null
  }
  const trackSort = (next: ShareSearch) => {
    void posthog.capture('share_sorted', { order: next.order ?? 'default' })
  }
  const { cursor, place, scrollToRef } = useGridNavigation({
    columns: gridColumns,
    onActivateHeader: (column) => {
      const next = nextSort(current, column, ownerSort)
      trackSort(next)
      void navigate({ search: next, to: '.' })
    },
    rowCount: rows.length,
    scrollRef,
  })
  const isCursor = (row: number, column: string) =>
    cursor.row === row && gridColumns[cursor.column]?.id === column

  return (
    <div className="min-h-0 flex-1">
      <Grid
        scrollRef={scrollRef}
        scrollToRef={scrollToRef}
        footer={footer}
        isFetching={isFetching}
        onEndReached={onEndReached}
        renderBody={(body) => body}
        rows={rows}
        columns={gridColumns}
        renderHeader={({ column, style }) => {
          const sorted = getSort(column.id)
          const next = nextSort(current, column.id, ownerSort)
          return (
            <div
              role="columnheader"
              aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
              data-cursor={isCursor(HEADER_ROW, column.id) || undefined}
              style={style}
              className="relative flex h-8 items-center pr-3 pl-2 select-none"
              onPointerDown={() =>
                place(HEADER_ROW, gridColumns.indexOf(column))
              }
            >
              <Link
                to="."
                search={next}
                preload={false}
                tabIndex={-1}
                className="text-foreground flex min-w-0 flex-1 items-center gap-1.5"
                onClick={() => trackSort(next)}
              >
                <ColumnKindIcon kind={kinds.get(column.id) ?? 'text'} />
                <span data-mask className="truncate text-xs font-medium">
                  {column.id}
                </span>
                {sorted && (
                  <HugeiconsIcon
                    icon={sorted === 'ASC' ? ArrowUp02Icon : ArrowDown02Icon}
                    strokeWidth={2}
                    className="text-primary ml-auto size-3 shrink-0"
                  />
                )}
              </Link>
              {isCursor(HEADER_ROW, column.id) && (
                <span aria-hidden className={CURSOR_CLASS} />
              )}
            </div>
          )
        }}
        renderCell={({ column, row, rowIndex, style }) => {
          const value = row[column.id]
          const kind = kinds.get(column.id)
          return (
            <div
              role="gridcell"
              data-cursor={isCursor(rowIndex, column.id) || undefined}
              style={style}
              className={cn(
                'relative flex h-full scroll-mt-8 items-center gap-1 px-2 text-xs',
                typeof value !== 'string' && 'text-muted-foreground/60'
              )}
              onPointerDown={() => place(rowIndex, gridColumns.indexOf(column))}
            >
              {typeof value !== 'string' && 'null'}
              {typeof value === 'string' &&
                (kind === 'boolean' ? (
                  <Checkbox
                    aria-label={`Value of ${column.id}`}
                    checked={value === 'true'}
                    readOnly
                    tabIndex={-1}
                  />
                ) : (
                  <span
                    data-mask
                    className={cn(
                      'truncate',
                      (kind === 'number' ||
                        kind === 'date' ||
                        kind === 'time') &&
                        'tabular-nums'
                    )}
                  >
                    {value}
                  </span>
                ))}
              {isCursor(rowIndex, column.id) && (
                <span aria-hidden className={CURSOR_CLASS} />
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
