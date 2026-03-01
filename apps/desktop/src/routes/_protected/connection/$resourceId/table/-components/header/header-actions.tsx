import type { ActiveFilter } from '@conar/shared/filters'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiExportLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { ExportData } from '~/components/export-data'
import { resourceConstraintsQuery, resourceRowsQuery, resourceTableColumnsQuery, resourceTableTotalQuery, rowsQuery } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { queryClient } from '~/main'
import { Route } from '../..'
import { usePageStoreContext } from '../../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsCopy } from './header-actions-copy'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'
import { HeaderActionsOrder } from './header-actions-order'

export function HeaderActions({ table, schema }: { table: string, schema: string }) {
  const { connectionResource } = Route.useRouteContext()
  const store = usePageStoreContext()
  const [filters, orderBy, exact, selected] = useStore(store, state => [state.filters, state.orderBy, state.exact, state.selected])
  const { isFetching, dataUpdatedAt, refetch, data: rows = [], isPending } = useInfiniteQuery(
    resourceRowsQuery({ connectionResource, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(resourceTableColumnsQuery({ connectionResource, table, schema }))
    queryClient.invalidateQueries(resourceTableTotalQuery({ connectionResource, table, schema, query: { filters, exact } }))
    queryClient.invalidateQueries(resourceConstraintsQuery({ connectionResource }))
  }

  const getAllData = async ({ filters: exportFilters }: { filters?: ActiveFilter[] }) => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const batch = await rowsQuery({
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

  const getLimitedData = async ({ limit, filters: exportFilters }: { limit: number, filters?: ActiveFilter[] }) => rowsQuery({
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
    <div className="flex items-center gap-2">
      <HeaderActionsDelete
        table={table}
        schema={schema}
      />
      <HeaderActionsCopy
        table={table}
        schema={schema}
      />
      <HeaderActionsColumns
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder
        table={table}
        schema={schema}
      />
      <TooltipProvider>
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
          <TooltipContent side="top" align="end">
            Refresh rows
            <p className="text-xs text-muted-foreground">
              Last updated:
              {' '}
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Separator orientation="vertical" className="h-6!" />
      <ExportData
        selected={selected}
        filename={`${schema}_${table}`}
        getData={getData}
        trigger={({ isExporting }) => (
          <Button
            variant="outline"
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
