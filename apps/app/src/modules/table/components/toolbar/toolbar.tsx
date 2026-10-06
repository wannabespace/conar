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

import { ExportDataMenu } from '~/core/export/export-data'
import {
  resourceRowsQuery,
  resourceRowsQueryInfiniteOptions,
} from '~/core/queries/rows/list'
import { resourceTableTotalQueryOptions } from '~/core/queries/rows/total'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'
import { useTableSessionStore } from '~/core/table/session'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'
import { ActionsAdd } from './actions/actions-add'
import { ActionsColumns } from './actions/actions-columns'
import { ActionsCopy } from './actions/actions-copy'
import { ActionsOrder } from './actions/actions-order'
import { ActionsSeed } from './actions/actions-seed'
import { ActionsView } from './actions/actions-view'
import { FilterSearchBar } from './filter-search-bar'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const fetchAllRows = async ({
  columns,
  connectionResource,
  exportFilters,
  filters,
  orderBy,
  schema,
  table,
}: {
  columns: Column[]
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
      columns,
      limit,
      offset,
      query: {
        filters: exportFilters || filters,
        filtersConcatOperator: exportFilters ? 'OR' : 'AND',
        orderBy,
      },
      schema,
      table,
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
  maximumFractionDigits: 1,
  notation: 'compact',
} as const

const TableStats = ({
  exact,
  failed,
  isTotalFetching,
  onRequestExact,
  total,
  totalUpdatedAt,
}: {
  exact: boolean
  failed: boolean
  isTotalFetching: boolean
  onRequestExact: () => void
  total?: { count: number; isEstimated?: boolean }
  totalUpdatedAt: number
}) => {
  const canRequestExact = !failed && !exact && total?.isEstimated === true

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex" />}>
        <Button
          variant="outline"
          disabled={!canRequestExact}
          // oxlint-disable-next-line shadcn/no-restyle -- toolbar counters share one compact shape
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
            {failed && <span className="text-muted-foreground">–</span>}
            {!failed && total && (
              <NumberFlow
                value={total.count}
                format={COMPACT_COUNT_FORMAT}
                className={cn(
                  'tabular-nums',
                  isTotalFetching && 'text-muted-foreground/50 animate-pulse'
                )}
                prefix={total.isEstimated ? '~' : ''}
              />
            )}
            {!failed && !total && (
              <Skeleton className="h-2.5 w-6 rounded-full" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {failed && 'No row count — the query failed.'}
        {!failed && total && (
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
        )}
        {!failed && !total && 'Counting rows…'}
      </TooltipContent>
    </Tooltip>
  )
}

export const TableToolbar = ({
  onAddColumn,
  table,
  schema,
}: {
  onAddColumn: () => void
  table: string
  schema: string
}) => {
  const { connectionResource } = useRouteContext()
  const { columns } = useTableColumnsContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const [seedOpen, setSeedOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const tableType =
    tablesAndSchemas?.schemas
      .find((s) => s.name === schema)
      ?.tables?.find((t) => t.name === table)?.type ?? 'table'
  const { filters, orderBy } = useSubscription(store, {
    selector: (state) => ({
      filters: enabledFilters(state.filters),
      orderBy: state.orderBy,
    }),
  })
  const selected = useSubscription(sessionStore, {
    selector: (state) => state.selected,
  })
  const [exact, setExact] = useState(false)

  const {
    data: rows = [],
    isError: isRowsError,
    isPending,
    isPlaceholderData: isRowsPlaceholder,
    isSuccess: isRowsSuccess,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      columns,
      connectionResource,
      query: { filters, orderBy },
      schema,
      table,
    })
  )

  const {
    data: total,
    isFetching: isTotalFetching,
    dataUpdatedAt: totalUpdatedAt,
  } = useQuery({
    ...resourceTableTotalQueryOptions({
      columns,
      connectionResource,
      query: { exact, filters },
      schema,
      table,
    }),
    enabled: isRowsSuccess && !isRowsPlaceholder,
  })

  const getData = async ({
    limit,
    filters: dataFilters,
  }: {
    limit?: number
    filters?: ActiveFilter[]
  }) => {
    if (limit) {
      return resourceRowsQuery({
        columns,
        limit,
        offset: 0,
        query: {
          filters: dataFilters || filters,
          filtersConcatOperator: dataFilters ? 'OR' : 'AND',
          orderBy,
        },
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource))
    }

    return fetchAllRows({
      columns,
      connectionResource,
      exportFilters: dataFilters,
      filters,
      orderBy,
      schema,
      table,
    })
  }

  return (
    <div className="flex shrink-0 items-start gap-2 px-3 py-2">
      <TableStats
        exact={exact}
        failed={isRowsError}
        isTotalFetching={isTotalFetching}
        onRequestExact={() => setExact(true)}
        total={total}
        totalUpdatedAt={totalUpdatedAt}
      />
      <FilterSearchBar table={table} schema={schema} />
      <div className="flex shrink-0 items-center gap-1">
        <ActionsColumns />
        <ActionsOrder />
        <ActionsView />
        {tableType === 'table' && <ActionsAdd onAddColumn={onAddColumn} />}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              aria-label="More actions"
              render={
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="icon" />}
                />
              }
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="bottom">More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-44">
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
            schema={schema}
            open={codeOpen}
            onOpenChange={setCodeOpen}
          />
        )}
      </div>
    </div>
  )
}
