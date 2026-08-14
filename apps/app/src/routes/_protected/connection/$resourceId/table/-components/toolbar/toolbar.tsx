import NumberFlow from '@number-flow/react'
import {
  RiCodeSSlashLine,
  RiLayoutColumnLine,
  RiMenuLine,
  RiMoreLine,
  RiSeedlingLine,
} from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { enabledFilters } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
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

import { useTableColumnsContext } from '../../-lib/columns'
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

const TableStats = ({
  columnCount,
  exact,
  isTotalLoading,
  onRequestExact,
  total,
  totalUpdatedAt,
}: {
  columnCount: number
  exact: boolean
  isTotalLoading: boolean
  onRequestExact: () => void
  total?: { count: number; isEstimated?: boolean }
  totalUpdatedAt?: number
}) => {
  const rowLabel =
    total?.count === undefined
      ? '… rows'
      : `${total.isEstimated ? '~' : ''}${total.count} row${total.count === 1 ? '' : 's'}`

  return (
    <Tooltip>
      <TooltipTrigger
        className="bg-input text-2xs text-muted-foreground ring-foreground/4 flex h-8 shrink-0 cursor-default items-center gap-2 rounded-xl px-2.5 whitespace-nowrap tabular-nums shadow-xs ring-[0.5px]"
        onClick={onRequestExact}
      >
        <span className="flex items-center gap-1">
          <RiLayoutColumnLine className="text-muted-foreground/60 size-3" />
          {columnCount}
        </span>
        <span className="flex items-center gap-1">
          <RiMenuLine className="text-muted-foreground/60 size-3" />
          {total?.count === undefined ? (
            '…'
          ) : (
            <NumberFlow
              value={total.count}
              className={cn(
                'tabular-nums',
                isTotalLoading && 'text-muted-foreground/50 animate-pulse'
              )}
              prefix={total.isEstimated ? '~' : ''}
            />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex flex-col gap-0.5">
          <span>
            {columnCount} columns · {rowLabel}
            {!exact && total?.isEstimated && '. Click to get the exact count.'}
          </span>
          <span className="opacity-70">
            Updated:{' '}
            {totalUpdatedAt
              ? new Date(totalUpdatedAt).toLocaleTimeString()
              : 'never'}
          </span>
        </div>
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
  const { filters, exact, orderBy, selected } = useSubscription(store, {
    selector: (state) => ({
      orderBy: state.orderBy,
      exact: state.exact,
      selected: state.selected,
      filters: enabledFilters(state.filters),
    }),
  })

  const { columns } = useTableColumnsContext()
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
        columnCount={columns.length}
        exact={exact}
        isTotalLoading={isTotalLoading}
        onRequestExact={() =>
          store.set(
            (state) => ({ ...state, exact: true }) satisfies typeof state
          )
        }
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
              <RiMoreLine />
            </TooltipTrigger>
            <TooltipContent side="top">More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="top" align="end" className="min-w-44">
            {tableType === 'table' && (
              <DropdownMenuItem onClick={() => setSeedOpen(true)}>
                <RiSeedlingLine />
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
                <RiCodeSSlashLine />
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
