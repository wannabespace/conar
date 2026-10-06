import { SearchRemoveIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import {
  cellToFilterValues,
  enabledFilters,
  EQUAL_FILTER,
  IS_NULL_FILTER,
} from '@tamery/shared/filters'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { Popover, PopoverContent } from '@tamery/ui/components/popover'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { useDeferredValue, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { columnStatsQuery } from '~/core/queries/rows/column-stats'
import { resourceRowsQueryKey } from '~/core/queries/rows/list'
import { valueCountsQuery } from '~/core/queries/rows/value-counts'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'
import { isNumericColumn } from '~/core/table/cell/utils'
import { createTransformer } from '~/core/transformers/create-transformer'

import { useTablePageStore } from '../../lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TOP_VALUES = 50
const VALUE_CHARS = 60
// Engines cannot group or count-distinct these, so they have no distinct values to list.
const UNGROUPABLE_TYPE = /json|xml|blob|bytea|binary|image|geo|\[\]/iu
const RANGED_UI_TYPES = new Set<Column['uiType']>(['date', 'datetime', 'time'])

export const hasDistinctValues = (column: Column) =>
  !UNGROUPABLE_TYPE.test(column.type ?? '') && !column.isArray

const percent = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  style: 'percent',
})
const number = new Intl.NumberFormat()

const Count = ({ label, value }: { label: string; value: string }) => (
  <span className="whitespace-nowrap">
    <span className="font-medium tabular-nums">{value}</span>{' '}
    <span className="text-muted-foreground">{label}</span>
  </span>
)

const Bound = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd data-mask title={value} className="min-w-0 truncate tabular-nums">
      {value}
    </dd>
  </>
)

const StatsBody = ({
  column,
  filters,
  onFilter,
  schema,
  table,
}: {
  column: Column
  filters: ActiveFilter[]
  onFilter: (filter: ActiveFilter) => void
  schema: string
  table: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const [search, setSearch] = useState('')
  const term = useDeferredValue(search)
  const transformer = createTransformer(connection.type, column)
  const display = (value: unknown) => transformer.toDisplay(value, VALUE_CHARS)
  const key = resourceRowsQueryKey({ connectionResource, schema, table })
  const ranged = isNumericColumn(column) || RANGED_UI_TYPES.has(column.uiType)

  const { data: stats } = useQuery({
    queryFn: async () =>
      columnStatsQuery({
        column: column.id,
        filters,
        ranged,
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource)),
    queryKey: [...key, 'column-stats', column.id, filters],
  })
  const { data: values = [], isPending } = useQuery({
    queryFn: async () =>
      valueCountsQuery({
        column: column.id,
        filters,
        limit: TOP_VALUES,
        schema,
        table,
        term,
      }).run(await connectionResourceToQueryParams(connectionResource)),
    queryKey: [...key, 'value-counts', column.id, filters, term],
  })

  const empty = stats ? stats.total - stats.filled : 0
  const allUnique = !!stats && stats.filled > 1 && stats.unique === stats.filled
  const hidesList = allUnique && term === ''

  return (
    <div className="flex flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b px-4 text-xs">
        {stats ? (
          <>
            <span className="whitespace-nowrap">
              <Count label="unique of" value={number.format(stats.unique)} />{' '}
              <Count
                label={filters.length > 0 ? 'filtered rows' : 'rows'}
                value={number.format(stats.total)}
              />
            </span>
            <span className="text-muted-foreground">·</span>
            <Count
              label={
                empty === 0
                  ? 'empty'
                  : `empty (${percent.format(empty / stats.total)})`
              }
              value={number.format(empty)}
            />
          </>
        ) : (
          <Skeleton className="h-3 w-40" />
        )}
      </div>
      {ranged && stats && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-b px-4 py-2.5 text-xs">
          <Bound label="Min" value={display(stats.min ?? null)} />
          <Bound label="Max" value={display(stats.max ?? null)} />
        </dl>
      )}
      <Command size="sm" variant="transparent" shouldFilter={false} loop>
        <CommandInput
          autoFocus
          variant="flat"
          placeholder="Search values…"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {!hidesList && (
            <CommandEmpty>
              {isPending ? (
                'Counting…'
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <HugeiconsIcon
                    icon={SearchRemoveIcon}
                    strokeWidth={2}
                    className="text-muted-foreground size-4"
                  />
                  No matching values
                </span>
              )}
            </CommandEmpty>
          )}
          {hidesList ? (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              Every value is different. Search to find one.
            </p>
          ) : (
            <CommandGroup>
              {values.map(({ count, value }, index) => {
                const label = display(value)
                return (
                  <CommandItem
                    // Long values truncate to the same label, and cmdk merges items sharing a `value`.
                    // oxlint-disable-next-line react/no-array-index-key -- the list is one query's ranking, replaced whole
                    key={index}
                    value={String(index)}
                    onSelect={() =>
                      onFilter(
                        value === null
                          ? {
                              column: column.id,
                              ref: IS_NULL_FILTER,
                              values: [''],
                            }
                          : {
                              column: column.id,
                              ref: EQUAL_FILTER,
                              values: cellToFilterValues(EQUAL_FILTER, value),
                            }
                      )
                    }
                  >
                    <span
                      data-mask
                      className={
                        value === null
                          ? 'text-muted-foreground min-w-0 flex-1 truncate'
                          : 'min-w-0 flex-1 truncate'
                      }
                    >
                      {label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {number.format(count)}
                    </span>
                    <span
                      aria-hidden
                      className="bg-foreground/10 h-1 w-10 shrink-0 overflow-hidden rounded-full"
                    >
                      <span
                        className="bg-primary/70 block h-full w-(--share) rounded-full"
                        style={
                          {
                            '--share': `${(count / Math.max(stats?.total ?? count, 1)) * 100}%`,
                          } as CSSProperties
                        }
                      />
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  )
}

export const DistinctValues = ({
  onClose,
  schema,
  table,
  target,
}: {
  onClose: () => void
  schema: string
  table: string
  target: { anchor: Element; column: Column } | null
}) => {
  const store = useTablePageStore()
  const filters = enabledFilters(
    useSubscription(store, { selector: (state) => state.filters })
  )

  return (
    <Popover open={!!target} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <PopoverContent
          anchor={target.anchor}
          side="bottom"
          align="start"
          padding="none"
          className="w-80 overflow-hidden"
        >
          <StatsBody
            key={target.column.id}
            column={target.column}
            filters={filters}
            schema={schema}
            table={table}
            onFilter={(filter) => {
              store.set((state) => ({
                ...state,
                filters: [...state.filters, filter],
              }))
              onClose()
            }}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}
