/* oxlint-disable jsx-a11y/prefer-tag-over-role -- the app's virtualized flex grid cannot be built from table elements */
import { ArrowDown02Icon, ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ColumnKind } from '@tamery/shared/column-kind'
import type { GridRow } from '@tamery/table'
import { getColumnSize, Grid } from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { ColumnKindIcon } from '@tamery/ui/components/custom/column-kind-icon'
import { cn } from '@tamery/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { useRef } from 'react'

export const shareSearch = type({
  'order?': '"asc" | "desc"',
  'sort?': 'string',
})

type ShareSearch = typeof shareSearch.infer

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

const DIRECTIONS = { ASC: 'asc', DESC: 'desc' } as const

const nextSort = (
  current: ShareSearch,
  column: string,
  ownerSort: ShareSearch
): ShareSearch => {
  if (current.sort === column && current.order === 'desc' && !ownerSort.sort) {
    return {}
  }
  const next = {
    order:
      current.sort === column && current.order === 'asc'
        ? ('desc' as const)
        : ('asc' as const),
    sort: column,
  }
  return next.sort === ownerSort.sort && next.order === ownerSort.order
    ? {}
    : next
}

export const ShareGrid = ({
  columns,
  isFetching,
  onEndReached,
  orderBy,
  rows,
  search,
}: {
  columns: { id: string; kind: ColumnKind; type: string | null }[]
  isFetching: boolean
  onEndReached: () => void
  orderBy: Record<string, 'ASC' | 'DESC'>
  rows: GridRow[]
  search: ShareSearch
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const kinds = new Map(columns.map(({ id, kind }) => [id, kind]))
  const [ownerColumn, ownerDirection] = Object.entries(orderBy)[0] ?? []
  const ownerSort: ShareSearch = ownerColumn
    ? { order: ownerDirection && DIRECTIONS[ownerDirection], sort: ownerColumn }
    : {}
  const current: ShareSearch = search.sort
    ? { order: search.order ?? 'asc', sort: search.sort }
    : ownerSort
  const sortOf = (column: string) => {
    if (search.sort) {
      return current.sort === column ? current.order : undefined
    }
    const direction = orderBy[column]
    return direction && DIRECTIONS[direction]
  }

  return (
    <div className="min-h-0 flex-1">
      <Grid
        scrollRef={scrollRef}
        isFetching={isFetching}
        onEndReached={onEndReached}
        renderBody={(body) => body}
        rows={rows}
        columns={columns.map((column) => ({
          id: column.id,
          size: getColumnSize(column.type),
        }))}
        renderHeader={({ column, style }) => {
          const sorted = sortOf(column.id)
          return (
            <div
              role="columnheader"
              aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
              style={style}
              className="relative flex items-center py-2.5 pr-3 pl-2 select-none"
            >
              <Link
                to="."
                search={nextSort(current, column.id, ownerSort)}
                className="text-foreground flex min-w-0 flex-1 items-center gap-1.5"
              >
                <ColumnKindIcon kind={kinds.get(column.id) ?? 'text'} />
                <span data-mask className="truncate text-xs font-medium">
                  {column.id}
                </span>
                {sorted && (
                  <HugeiconsIcon
                    icon={sorted === 'asc' ? ArrowUp02Icon : ArrowDown02Icon}
                    strokeWidth={2}
                    className="text-primary ml-auto size-3 shrink-0"
                  />
                )}
              </Link>
            </div>
          )
        }}
        renderCell={({ column, row, style }) => {
          const value = row[column.id]
          const kind = kinds.get(column.id)
          return (
            <div
              role="gridcell"
              style={style}
              className={cn(
                'relative flex h-full items-center gap-1 px-2 text-xs',
                typeof value !== 'string' && 'text-muted-foreground/60'
              )}
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
            </div>
          )
        }}
      />
    </div>
  )
}
