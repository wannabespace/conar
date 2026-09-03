import {
  HashtagIcon,
  MoreHorizontalIcon,
  SourceCodeIcon,
  SproutIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { enabledFilters } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { ExportDataMenu } from '~/components/export-data'
import {
  resourceRowsQuery,
  resourceRowsQueryInfiniteOptions,
  resourceTablesAndSchemasQueryOptions,
  resourceTableTotalQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { getConnectionResourceStore } from '~/entities/connection/store'

import { useTablePageStore } from '../../-lib/store'
import { ActionsColumns } from './actions/actions-columns'
import { ActionsCopy } from './actions/actions-copy'
import { ActionsDelete } from './actions/actions-delete'
import { ActionsOrder } from './actions/actions-order'
import { ActionsSeed } from './actions/actions-seed'
import { DraftsActions } from './drafts-actions'
import { FilterSearchBar } from './filter-search-bar'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const fetchAllRows = async ({
  connectionResource,
  exportFilters,
  filters,
  orderBy,
  schema,
  table,
}: {
  connectionResource: Parameters<typeof connectionResourceToQueryParams>[0]
  exportFilters?: ActiveFilter[]
  filters: ActiveFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
  schema: string
  table: string
}) => {
  const data: Record<string, unknown>[] = []
  const limit = 1000
  let offset = 0
  const queryParams = await connectionResourceToQueryParams(connectionResource)

  while (true) {
    // oxlint-disable-next-line no-await-in-loop
    const batch = await resourceRowsQuery({
      schema,
      table,
      limit,
      offset,
      query: {
        orderBy,
        filters: exportFilters || filters,
        filtersConcatOperator: exportFilters ? 'OR' : 'AND',
      },
    }).run(queryParams)

    data.push(...batch)

    if (batch.length < limit) {
      break
    }

    offset += limit
  }

  return data
}

const COMPACT_COUNT_FORMAT = {
  notation: 'compact',
  maximumFractionDigits: 1,
} as const

const TableStats = ({
  exact,
  isTotalLoading,
  onRequestExact,
  total,
  totalUpdatedAt,
}: {
  exact: boolean
  isTotalLoading: boolean
  onRequestExact: () => void
  total?: { count: number; isEstimated?: boolean }
  totalUpdatedAt: number
}) => {
  const canRequestExact = !exact && total?.isEstimated === true

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex" />}>
        <Button
          variant="outline"
          disabled={!canRequestExact}
          className="gap-1.5 px-2.5 disabled:opacity-100"
          onClick={onRequestExact}
        >
          <HugeiconsIcon
            icon={HashtagIcon}
            strokeWidth={2}
            className="text-muted-foreground/60"
          />
          <span
            className={cn(
              'text-2xs font-normal tabular-nums',
              canRequestExact &&
                'decoration-muted-foreground/50 underline decoration-dotted underline-offset-2'
            )}
          >
            {total ? (
              <NumberFlow
                value={total.count}
                format={COMPACT_COUNT_FORMAT}
                className={cn(
                  'tabular-nums',
                  isTotalLoading && 'text-muted-foreground/50 animate-pulse'
                )}
                prefix={total.isEstimated ? '~' : ''}
              />
            ) : (
              <Skeleton className="h-2.5 w-6 rounded-full" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {total ? (
          <div className="flex flex-col gap-0.5">
            <span>
              {total.isEstimated ? '~' : ''}
              {total.count.toLocaleString()} row{total.count === 1 ? '' : 's'}
              {canRequestExact && '. Click to get the exact count.'}
            </span>
            <span className="opacity-70">
              Updated: {new Date(totalUpdatedAt).toLocaleTimeString()}
            </span>
          </div>
        ) : (
          'Counting rows…'
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export const TableToolbar = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const [seedOpen, setSeedOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const connectionStore = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(connectionStore, {
    selector: (state) => state.showSystem,
  })
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )
  const tableType =
    tablesAndSchemas?.schemas
      .find((s) => s.name === schema)
      ?.tables?.find((t) => t.name === table)?.type ?? 'table'
  const { filters, orderBy, selected } = useSubscription(store, {
    selector: (state) => ({
      orderBy: state.orderBy,
      selected: state.selected,
      filters: enabledFilters(state.filters),
    }),
  })
  const [exact, setExact] = useState(false)

  const {
    data: total,
    isLoading: isTotalLoading,
    dataUpdatedAt: totalUpdatedAt,
  } = useQuery(
    resourceTableTotalQueryOptions({
      connectionResource,
      table,
      schema,
      query: { filters, exact },
    })
  )

  const { data: rows = [], isPending } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: { filters, orderBy },
    })
  )

  const getData = async ({
    limit,
    filters: dataFilters,
  }: {
    limit?: number
    filters?: ActiveFilter[]
  }) => {
    if (limit) {
      return resourceRowsQuery({
        schema,
        table,
        limit,
        offset: 0,
        query: {
          orderBy,
          filters: dataFilters || filters,
          filtersConcatOperator: dataFilters ? 'OR' : 'AND',
        },
      }).run(await connectionResourceToQueryParams(connectionResource))
    }

    return fetchAllRows({
      connectionResource,
      exportFilters: dataFilters,
      filters,
      orderBy,
      schema,
      table,
    })
  }

  return (
    <div className="pointer-events-none flex w-full max-w-3xl items-end gap-2 *:pointer-events-auto">
      <TableStats
        exact={exact}
        isTotalLoading={isTotalLoading}
        onRequestExact={() => setExact(true)}
        total={total}
        totalUpdatedAt={totalUpdatedAt}
      />
      <FilterSearchBar table={table} schema={schema} />
      <DraftsActions table={table} schema={schema} />
      {tableType === 'table' && <ActionsDelete table={table} schema={schema} />}
      <div className="flex shrink-0 items-center gap-1">
        <ActionsColumns />
        <ActionsOrder />
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="icon" />}
                />
              }
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="top">More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="top" align="end" className="min-w-44">
            {tableType === 'table' && (
              <DropdownMenuItem onClick={() => setSeedOpen(true)}>
                <HugeiconsIcon icon={SproutIcon} strokeWidth={2} />
                Seed data
              </DropdownMenuItem>
            )}
            <ExportDataMenu
              selected={selected}
              filename={`${schema}_${table}`}
              getData={getData}
              disabled={rows?.length === 0 || isPending}
            />
            {tableType === 'table' && (
              <DropdownMenuItem onClick={() => setCodeOpen(true)}>
                <HugeiconsIcon icon={SourceCodeIcon} strokeWidth={2} />
                Code
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {tableType === 'table' && (
          <ActionsSeed
            table={table}
            schema={schema}
            open={seedOpen}
            onOpenChange={setSeedOpen}
          />
        )}
        {tableType === 'table' && (
          <ActionsCopy
            table={table}
            open={codeOpen}
            onOpenChange={setCodeOpen}
          />
        )}
      </div>
    </div>
  )
}
