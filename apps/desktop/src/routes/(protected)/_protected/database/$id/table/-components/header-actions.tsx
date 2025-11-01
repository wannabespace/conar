import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useCallback } from 'react'
import { ExportData } from '~/components/export-data'
import { databaseConstraintsQuery, databaseRowsQuery, databaseTableColumnsQuery } from '~/entities/database'
import { rowsSql } from '~/entities/database/sql/rows'
import { queryClient } from '~/main'
import { usePageStoreContext } from '../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'

export function HeaderActions({ table, schema, database }: { table: string, schema: string, database: typeof databases.$inferSelect }) {
  const store = usePageStoreContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { isFetching, dataUpdatedAt, refetch, data } = useInfiniteQuery(
    databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(databaseTableColumnsQuery({ database, table, schema }))
    queryClient.invalidateQueries(databaseConstraintsQuery({ database }))
  }

  // Fetch all data for export (bypassing pagination)
  const fetchAllData = useCallback(async () => {
    const allData: Record<string, unknown>[] = []
    let offset = 0
    const limit = 1000 // Fetch in larger chunks for export

    while (true) {
      const batch = await rowsSql(database, {
        schema,
        table,
        limit,
        offset,
        orderBy,
        filters,
      })

      allData.push(...batch)

      // If we got less than the limit, we've reached the end
      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return allData
  }, [database, schema, table, orderBy, filters])

  // The query already flattens all pages via the select option
  const allRows = data ?? []

  return (
    <div className="flex gap-2">
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
      <ExportData data={allRows} filename={`${schema}_${table}`} fetchAllData={fetchAllData} />
    </div>
  )
}
