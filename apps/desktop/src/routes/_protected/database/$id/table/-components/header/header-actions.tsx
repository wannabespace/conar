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
import { connectionConstraintsQuery, connectionRowsQuery, connectionTableColumnsQuery, connectionTableTotalQuery } from '~/entities/connection/queries'
import { rowsQuery } from '~/entities/connection/sql/rows'
import { queryClient } from '~/main'
import { Route } from '../../'
import { usePageStoreContext } from '../../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsCopy } from './header-actions-copy'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'
import { HeaderActionsOrder } from './header-actions-order'

export function HeaderActions({ table, schema }: { table: string, schema: string }) {
  const { connection } = Route.useLoaderData()
  const store = usePageStoreContext()
  const [filters, orderBy, exact, selected] = useStore(store, state => [state.filters, state.orderBy, state.exact, state.selected])
  const { isFetching, dataUpdatedAt, refetch, data: rows = [], isPending } = useInfiniteQuery(
    connectionRowsQuery({ connection, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(connectionTableColumnsQuery({ connection, table, schema }))
    queryClient.invalidateQueries(connectionTableTotalQuery({ connection, table, schema, query: { filters, exact } }))
    queryClient.invalidateQueries(connectionConstraintsQuery({ connection }))
  }

  const getAllData = async ({ selectedFilters }: { selectedFilters?: ActiveFilter[] }) => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const batch = await rowsQuery(connection, {
        schema,
        table,
        limit,
        offset,
        orderBy,
        filters: selectedFilters || filters,
        filtersConcatOperator: selectedFilters ? 'OR' : 'AND',
      })

      data.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return data
  }

  const getLimitedData = async ({ limit, selectedFilters }: { limit: number, selectedFilters?: ActiveFilter[] }) => rowsQuery(connection, {
    schema,
    table,
    limit,
    offset: 0,
    orderBy,
    filters: selectedFilters || filters,
    filtersConcatOperator: selectedFilters ? 'OR' : 'AND',
  })

  const getData = async ({ limit, selectedFilters }: { limit?: number, selectedFilters?: ActiveFilter[] }) => {
    return limit ? getLimitedData({ limit, selectedFilters }) : getAllData({ selectedFilters })
  }

  return (
    <div className="flex items-center gap-2">
      <HeaderActionsDelete
        table={table}
        schema={schema}
        connection={connection}
      />
      <HeaderActionsCopy
        connection={connection}
        table={table}
        schema={schema}
      />
      <HeaderActionsColumns
        connection={connection}
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder
        connection={connection}
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
        rowsCount={rows.length}
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
