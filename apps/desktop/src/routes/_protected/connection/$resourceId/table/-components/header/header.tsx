import type { ActiveFilter } from '@conar/shared/filters'
import { pick } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiCheckLine, RiExportLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSubscription } from 'seitu/react'
import { ExportData } from '~/components/export-data'
import { resourceConstraintsQueryOptions, resourceRowsQuery, resourceRowsQueryInfiniteOptions, resourceTableColumnsQueryOptions, resourceTableTotalQueryOptions } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { queryClient } from '~/main'
import { Route } from '../..'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsCopy } from './header-actions-copy'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'
import { HeaderActionsOrder } from './header-actions-order'
import { HeaderSearch } from './header-search'

export function Header({ table, schema }: { table: string, schema: string }) {
  const { connectionResource } = Route.useRouteContext()
  const columns = useTableColumns({ connectionResource, table, schema })
  const store = usePageStoreContext()
  const { filters, exact, orderBy, selected } = useSubscription(store, { selector: state => pick(state, ['filters', 'orderBy', 'exact', 'selected']) })
  const { data: total, isLoading } = useQuery(resourceTableTotalQueryOptions({ connectionResource, table, schema, query: { filters, exact } }))

  const columnsCount = columns?.length ?? 0

  const { isFetching, dataUpdatedAt, refetch, data: rows = [], isPending } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(resourceTableColumnsQueryOptions({ connectionResource, table, schema }))
    queryClient.invalidateQueries(resourceTableTotalQueryOptions({ connectionResource, table, schema, query: { filters, exact } }))
    queryClient.invalidateQueries(resourceConstraintsQueryOptions({ connectionResource }))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  const getAllData = async ({ filters: exportFilters }: { filters?: ActiveFilter[] }) => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
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
      }).run(connectionResourceToQueryParams(connectionResource))

      data.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return data
  }

  const getLimitedData = async ({ limit, filters: exportFilters }: { limit: number, filters?: ActiveFilter[] }) => resourceRowsQuery({
    schema,
    table,
    limit,
    offset: 0,
    query: {
      orderBy,
      filters: exportFilters || filters,
      filtersConcatOperator: exportFilters ? 'OR' : 'AND',
    },
  }).run(connectionResourceToQueryParams(connectionResource))

  const getData = async ({ limit, filters }: { limit?: number, filters?: ActiveFilter[] }) => {
    return limit ? getLimitedData({ limit, filters }) : getAllData({ filters })
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="shrink-0">
        <h2 className="text-sm">
          <span className="text-muted-foreground">
            {schema}
            .
          </span>
          <span data-mask className="font-medium">{table}</span>
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            <span className="tabular-nums">{columnsCount}</span>
            {' '}
            column
            {columnsCount === 1 ? '' : 's'}
          </span>
          <Separator orientation="vertical" className="h-3!" />
          {total?.count === undefined
            ? <>...</>
            : (
                <Tooltip>
                  <TooltipTrigger
                    className={cn('inline-flex items-center gap-1', !exact && total.isEstimated && `
                      cursor-pointer
                    `)}
                    onClick={() => store.set(state => ({ ...state, exact: true } satisfies typeof state))}
                  >
                    <NumberFlow
                      value={total.count}
                      className={cn('text-muted-foreground tabular-nums', isLoading && `
                        animate-pulse text-muted-foreground/50
                      `)}
                      prefix={total.isEstimated ? '~' : ''}
                      suffix={total.count === 1 ? ' row' : ' rows'}
                    />
                  </TooltipTrigger>
                  {!exact && total.isEstimated && (
                    <TooltipContent side="bottom">
                      Click to get the exact count.
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
        </div>
      </div>
      <Separator orientation="vertical" className="mx-2 h-6!" />
      <HeaderSearch table={table} schema={schema} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <LoadingContent loading={isFetching}>
              <ContentSwitch
                activeContent={<RiCheckLine className="text-success" />}
                active={isFetching}
              >
                <RiLoopLeftLine />
              </ContentSwitch>
            </LoadingContent>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Refresh rows
          <p className="text-xs text-muted-foreground">
            Last updated:
            {' '}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
          </p>
        </TooltipContent>
      </Tooltip>
      <HeaderActionsDelete
        table={table}
        schema={schema}
      />
      <Separator orientation="vertical" className="mx-2 h-6!" />
      <HeaderActionsColumns
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder
        table={table}
        schema={schema}
      />
      <Separator orientation="vertical" className="mx-2 h-6!" />
      <HeaderActionsCopy
        table={table}
        schema={schema}
      />
      <ExportData
        selected={selected}
        filename={`${schema}_${table}`}
        getData={getData}
        trigger={({ isExporting }) => (
          <Button
            variant="secondary"
            size="icon"
            disabled={isExporting || rows?.length === 0 || isPending}
          >
            <LoadingContent loading={isExporting}>
              <RiExportLine />
            </LoadingContent>
          </Button>
        )}
      />
    </div>
  )
}
