import type { PageSize } from '~/entities/database'
import { Button } from '@connnect/ui/components/button'
import { CardDescription, CardTitle } from '@connnect/ui/components/card'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiLoopLeftLine } from '@remixicon/react'
import { useIsFetching, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { databaseColumnsQuery, databaseRowsQuery, DataTable, DataTableFooter, useDatabase, useDatabaseColumns } from '~/entities/database'
import { queryClient } from '~/main'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, table } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const { data: databaseColumns } = useDatabaseColumns(database, table)
  const queryOpts = databaseRowsQuery(database, table, { page, limit: pageSize })
  const { data, isPending } = useQuery(queryOpts)
  const isFetching = useIsFetching(databaseRowsQuery(database, table, { page: 1, limit: pageSize })) > 0
  const [total, setTotal] = useState(data?.total ?? null)

  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  useEffect(() => {
    if (data?.total !== undefined) {
      setTotal(data?.total ?? 0)
    }
  }, [data?.total])

  const handleRefresh = () => {
    setPage(1)
    queryClient.invalidateQueries({ queryKey: queryOpts.queryKey.slice(0, -1) })
    queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table).queryKey })
  }

  const rows = data?.rows ?? []

  return (
    <div className="h-screen flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between p-4">
        <div>
          <CardTitle>
            {table}
          </CardTitle>
          <CardDescription>
            {databaseColumns?.length || 0}
            {' '}
            column
            {databaseColumns?.length === 1 ? '' : 's'}
            {' '}
            •
            {' '}
            {total ?? '...'}
            {' '}
            row
            {total === 1 ? '' : 's'}
          </CardDescription>
        </div>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  aria-label="Refresh data"
                >
                  <LoadingContent loading={isFetching}>
                    <RiLoopLeftLine size={18} />
                  </LoadingContent>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Refresh data
                <p className="text-xs text-muted-foreground">
                  Table data is cached. Click to fetch the latest data.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex-1 overflow-hidden pb-0">
        <DataTable
          key={table}
          loading={isPending}
          data={rows}
          columns={databaseColumns.map(column => ({
            name: column.column_name,
            type: column.data_type,
          }))}
          className="h-full"
        />
      </div>
      <div
        className="flex flex-col"
        onMouseEnter={() => setCanPrefetch(true)}
        onMouseLeave={() => setCanPrefetch(false)}
      >
        <Separator className="h-[2px]" />
        <DataTableFooter
          className="p-4"
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
          total={total ?? 0}
        />
      </div>
    </div>
  )
}
