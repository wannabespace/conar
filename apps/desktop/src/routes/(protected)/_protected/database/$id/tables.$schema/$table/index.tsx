import type { PageSize } from '~/entities/database'
import { title } from '@connnect/shared/utils/title'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { databaseColumnsQuery, databaseQuery, databaseRowsQuery, prefetchDatabaseTableCore, useDatabase } from '~/entities/database'
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

function RouteComponent() {
  const { id, table, schema } = Route.useParams()

  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const [selectedRows, setSelectedRows] = useState({})

  const rowsQueryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })

  const { data: columns } = useSuspenseQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })

  return (
    <div className="h-screen flex flex-col justify-between">
      <Header
        columns={columns}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        rowsQueryOpts={rowsQueryOpts}
        setPage={setPage}
      />
      <div className="flex-1 overflow-hidden">
        <Table
          rowsQueryOpts={rowsQueryOpts}
          columns={columns}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      </div>
      <Footer
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  )
}
