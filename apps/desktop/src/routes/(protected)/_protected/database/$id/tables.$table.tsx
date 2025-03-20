import type { PageSize } from '~/entities/database'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiRefreshLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
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
  const [total, setTotal] = useState(data?.total ?? 0)

  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    queryClient.ensureQueryData(databaseRowsQuery(database, table, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  useEffect(() => {
    if (data?.total !== undefined) {
      setTotal(data?.total ?? 0)
    }
  }, [data?.total])

  const handleRefresh = () => {
    setPage(1)
    queryClient.resetQueries({ queryKey: queryOpts.queryKey.slice(0, -1) })
    queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table).queryKey })
  }

  const rows = data?.rows ?? []

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {table}
          </CardTitle>
          <CardDescription className="text-xs mt-2">
            {total}
            {' '}
            row
            {total === 1 ? '' : 's'}
            {' '}
            •
            {' '}
            {databaseColumns?.length || 0}
            {' '}
            column
            {databaseColumns?.length === 1 ? '' : 's'}
          </CardDescription>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                aria-label="Refresh data"
              >
                <RiRefreshLine size={18} />
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
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-0">
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
      </CardContent>
      <CardFooter
        className="flex flex-col"
        onMouseEnter={() => setCanPrefetch(true)}
        onMouseLeave={() => setCanPrefetch(false)}
      >
        <Separator className="mb-4 h-[2px]" />
        <DataTableFooter
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
          total={total}
        />
      </CardFooter>
    </Card>
  )
}
