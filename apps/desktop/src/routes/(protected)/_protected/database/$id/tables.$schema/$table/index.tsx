import type { PageSize, WhereFilter } from '~/entities/database'
import { SQL_OPERATORS_LIST } from '@connnect/shared/utils/sql'
import { title } from '@connnect/shared/utils/title'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { createContext, use, useState } from 'react'
import { databaseQuery, DataFiltersProvider, prefetchDatabaseTableCore } from '~/entities/database'
import { queryClient } from '~/main'
import { Filters } from './-components/filters'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { Table } from './-components/table'
import { useColumnsQuery } from './-queries/use-columns-query'

const TableStoreContext = createContext<Store<{
  page: number
  pageSize: PageSize
  selected: number[]
  filters: WhereFilter[]
  orderBy?: [string, 'ASC' | 'DESC']
}>>(null!)

export function useTableStoreContext() {
  return use(TableStoreContext)
}

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
  const [store] = useState(() => new Store({
    page: 1,
    pageSize: 50 satisfies PageSize as PageSize,
    selected: [] as number[],
    filters: [] as WhereFilter[],
  }))
  const { data: columns } = useColumnsQuery()

  return (
    <TableStoreContext value={store}>
      <DataFiltersProvider
        columns={columns}
        operators={SQL_OPERATORS_LIST}
      >
        <div className="h-screen flex flex-col justify-between">
          <div className="flex flex-col gap-4 p-4">
            <Header />
            <Filters />
          </div>
          <div className="flex-1 overflow-hidden">
            <Table />
          </div>
          <Footer />
        </div>
      </DataFiltersProvider>
    </TableStoreContext>
  )
}
