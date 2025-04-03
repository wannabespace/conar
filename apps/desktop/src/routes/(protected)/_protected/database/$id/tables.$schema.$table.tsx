import type { QueryKey } from '@tanstack/react-query'
import type { PageSize } from '~/entities/database'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiLoopLeftLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseRowsQuery, DataTable, DataTableFooter, useDatabase, useDatabasePrimaryKeys } from '~/entities/database'
import { queryClient } from '~/main'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table',
)({
  component: RouteComponent,
})

const TableContext = createContext<{
  page: number
  setPage: (page: number) => void
  pageSize: PageSize
  setPageSize: (pageSize: PageSize) => void
  total: number | null
}>(null!)

function TableHeader({ queryKey, columnsCount }: { queryKey: QueryKey, columnsCount: number }) {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { setPage, pageSize, total } = use(TableContext)
  const { isFetching, dataUpdatedAt } = useQuery(databaseRowsQuery(database, table, schema, { page: 1, limit: pageSize }))

  async function handleRefresh() {
    setPage(1)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) }),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
    toast.success('Data refreshed')
  }

  return (
    <div className="flex gap-6 flex-row items-center justify-between p-4">
      <div>
        <h2 className="font-medium text-sm mb-0.5">
          {table}
        </h2>
        <p className="text-muted-foreground text-xs">
          {columnsCount}
          {' '}
          column
          {columnsCount === 1 ? '' : 's'}
          {' '}
          •
          {' '}
          {total ?? '...'}
          {' '}
          row
          {total === 1 ? '' : 's'}
        </p>
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
              >
                <LoadingContent loading={isFetching}>
                  <RiLoopLeftLine />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Refresh data
              <p className="text-xs text-muted-foreground">
                Table data is cached. Click to fetch the latest data.
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated:
                {' '}
                {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

function TableFooter() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { page, setPage, pageSize, total, setPageSize } = use(TableContext)
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    setPageSize(50)
  }, [table])

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  if (!total || total < 50) {
    return null
  }

  return (
    <div
      className="flex flex-col bg-muted/20"
      onMouseEnter={() => setCanPrefetch(true)}
      onMouseLeave={() => setCanPrefetch(false)}
    >
      <Separator className="h-[2px]" />
      <DataTableFooter
        className="p-2"
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
  )
}

function RouteComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const queryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })
  const { data, isPending, status } = useQuery(queryOpts)
  const { data: primaryKeys } = useDatabasePrimaryKeys(database)
  const { data: databaseColumns } = useQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: (data) => {
      const pks = primaryKeys?.find(key => key.table === table && key.schema === schema)?.primaryKeys

      return data.map(column => ({
        ...column,
        isPrimaryKey: !!pks?.includes(column.name),
      }))
    },
  })

  const [total, setTotal] = useState(data?.total ?? null)

  useEffect(() => {
    if (status === 'success') {
      setTotal(data.total)
    }
  }, [status])

  const rows = data?.rows ?? []
  const columns = databaseColumns ?? []

  const context = useMemo(() => ({
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
  }), [page, setPage, pageSize, setPageSize, total])

  return (
    <TableContext value={context}>
      <div className="h-screen flex flex-col justify-between">
        <TableHeader
          queryKey={queryOpts.queryKey}
          columnsCount={columns.length}
        />
        <div className="flex-1 overflow-hidden pb-0">
          <DataTable
            key={table}
            database={database}
            tableName={table}
            loading={isPending}
            data={rows}
            columns={columns}
            className="h-full"
          />
        </div>
        <TableFooter />
      </div>
    </TableContext>
  )
}
