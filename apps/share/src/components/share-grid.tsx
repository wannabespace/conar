/* oxlint-disable jsx-a11y/prefer-tag-over-role -- the app's virtualized flex grid cannot be built from table elements */
import { ArrowDown02Icon, ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { GridRow } from '@tamery/table'
import { getColumnSize, Grid } from '@tamery/table'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { cn } from '@tamery/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { useRef } from 'react'

import { getColumnKind } from './column-kind'

export const shareSearch = type({
  'order?': '"asc" | "desc"',
  'sort?': 'string',
})

type ShareSearch = typeof shareSearch.infer

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

const nextSort = (
  { order, sort }: ShareSearch,
  column: string
): ShareSearch => {
  if (sort !== column) {
    return { order: 'asc', sort: column }
  }
  return order === 'asc' ? { order: 'desc', sort: column } : {}
}

export const ShareGrid = ({
  columns,
  isFetching,
  onEndReached,
  rows,
  search,
}: {
  columns: { id: string; type: string }[]
  isFetching: boolean
  onEndReached: () => void
  rows: GridRow[]
  search: ShareSearch
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const kinds = new Map(
    columns.map((column) => [column.id, getColumnKind(column.type)])
  )
  const kindOf = (id: string) => kinds.get(id) ?? getColumnKind('')

  return (
    <div className="min-h-0 flex-1">
      <Grid
        scrollRef={scrollRef}
        isFetching={isFetching}
        onEndReached={onEndReached}
        renderBody={(body) => body}
        rows={rows}
        columns={columns.map(({ id, type: columnType }) => ({
          id,
          size: getColumnSize(columnType),
        }))}
        renderHeader={({ column, style }) => {
          const sorted =
            search.sort === column.id ? (search.order ?? 'asc') : null
          return (
            <div
              role="columnheader"
              aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
              // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
              style={style}
              className="relative flex items-center py-2.5 pr-3 pl-2 select-none"
            >
              <Link
                to="."
                search={nextSort(search, column.id)}
                className="text-foreground flex min-w-0 flex-1 items-center gap-1.5"
              >
                <HugeiconsIcon
                  icon={kindOf(column.id).icon}
                  strokeWidth={2}
                  className="text-muted-foreground size-3.5 shrink-0"
                />
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
          const { kind } = kindOf(column.id)
          return (
            <div
              role="gridcell"
              // oxlint-disable-next-line shadcn/no-inline-styles -- column geometry comes from the grid's per-column variables
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
                      (kind === 'number' || kind === 'date') && 'tabular-nums'
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
