import type { Dispatch, SetStateAction } from 'react'
import type { columnType, PageSize } from '~/entities/database'
import { title } from '@connnect/shared/utils/title'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createContext, use, useMemo, useState } from 'react'
import { databaseColumnsQuery, databaseQuery, prefetchDatabaseTableCore, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { Table } from './-components/table'
import { usePrimaryKeysQuery } from './-queries/use-primary-keys-query'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table/',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))
    await prefetchDatabaseTableCore(database, params.schema, params.table)
    return { database }
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: title(`${params.schema}.${params.table}`, loaderData.database.name),
      },
    ],
  }),
})

const TableContext = createContext<{
  page: number
  setPage: Dispatch<SetStateAction<number>>
  pageSize: PageSize
  setPageSize: Dispatch<SetStateAction<PageSize>>
  columns: (typeof columnType.infer & {
    isPrimaryKey: boolean
  })[]
  selectedRows: Record<string, boolean>
  setSelectedRows: Dispatch<SetStateAction<Record<string, boolean>>>
}>(null!)

export function useTableContext() {
  return use(TableContext)
}

function RouteComponent() {
  const { id, table, schema } = Route.useParams()

  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const [selectedRows, setSelectedRows] = useState({})

  const { data: columns } = useSuspenseQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })

  const context = useMemo(() => ({
    page,
    setPage,
    pageSize,
    setPageSize,
    columns,
    selectedRows,
    setSelectedRows,
  }), [page, pageSize, columns, selectedRows])

  return (
    <TableContext value={context}>
      <div className="h-screen flex flex-col justify-between">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Table />
        </div>
        <Footer />
      </div>
    </TableContext>
  )
}
