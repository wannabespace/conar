import type { PageSize } from '~/entities/database'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiRefreshLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { databaseRowsQuery, DataTable, DataTableFooter, useDatabase, useDatabaseColumns } from '~/entities/database'
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

  const handleRefresh = () => {
    setPage(1)
    queryClient.invalidateQueries({ queryKey: queryOpts.queryKey.slice(0, -1) })
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {table}
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                aria-label="Refresh data"
              >
                <RiRefreshLine size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Click to refresh data and clear cache
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
      <CardFooter className="flex flex-col">
        <Separator className="mb-4" />
        <DataTableFooter
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(value) => {
            setPage(1)
            setPageSize(value)
          }}
          total={total}
          loading={isPending}
        />
      </CardFooter>
    </Card>
  )
}
