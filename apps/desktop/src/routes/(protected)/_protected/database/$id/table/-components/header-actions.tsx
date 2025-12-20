import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiExportLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { ExportData } from '~/components/export-data'
import { databaseConstraintsQuery, databaseRowsQuery, databaseTableColumnsQuery, databaseTableTotalQuery, rowsQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { usePageStoreContext } from '../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'
import { HeaderActionsOrder } from './header-actions-order'

export function HeaderActions({ table, schema, database }: { table: string, schema: string, database: typeof databases.$inferSelect }) {
  const store = usePageStoreContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { isFetching, dataUpdatedAt, refetch, data: rows, isPending } = useInfiniteQuery(
    databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(databaseTableColumnsQuery({ database, table, schema }))
    queryClient.invalidateQueries(databaseTableTotalQuery({ database, table, schema, query: { filters } }))
    queryClient.invalidateQueries(databaseConstraintsQuery({ database }))
  }

  const getAllData = async () => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const batch = await rowsQuery.run(database, {
        schema,
        table,
        limit,
        offset,
        orderBy,
        filters,
      })

      data.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return data
  }

  const getLimitedData = async (limit: number) => rowsQuery.run(database, {
    schema,
    table,
    limit,
    offset: 0,
    orderBy,
    filters,
  })

  const getData = async (limit?: number) => {
    return limit ? getLimitedData(limit) : getAllData()
  }

  return (
    <div className="flex items-center gap-2">
      <HeaderActionsDelete
        table={table}
        schema={schema}
        database={database}
      />
      <HeaderActionsColumns
        database={database}
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder
        database={database}
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
