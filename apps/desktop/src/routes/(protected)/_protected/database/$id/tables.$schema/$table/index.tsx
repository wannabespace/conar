import type { PageSize } from '~/entities/database'
import { title } from '@connnect/shared/utils/title'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { createContext, use, useRef } from 'react'
import { databaseColumnsQuery, databaseQuery, prefetchDatabaseTableCore, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { Table } from './-components/table'
import { usePrimaryKeysQuery } from './-queries/use-primary-keys-query'

// const TableContext = createContext<{
//   rowsQueryOpts: ReturnType<typeof databaseRowsQuery>
//   page: number
//   setPage: (page: number) => void
//   pageSize: PageSize
//   setPageSize: (pageSize: PageSize) => void
//   selectedRows: Record<string, boolean>
//   setSelectedRows: (rows: Record<string, boolean>) => void
// }>(null!)

type TableStoreType = Store<{
  page: number
  pageSize: PageSize
  selected: number[]
}>

const TableStoreContext = createContext<TableStoreType>(null!)

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
  const { id, table, schema } = Route.useParams()

  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const { data: columns } = useSuspenseQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })

  const context = useRef(new Store({
    page: 1,
    pageSize: 50 satisfies PageSize as PageSize,
    selected: [] as number[],
  })).current

  return (
    <TableStoreContext value={context}>
      <div className="h-screen flex flex-col justify-between">
        <Header columns={columns} />
        <div className="flex-1 overflow-hidden">
          <Table columns={columns} />
        </div>
        <Footer />
      </div>
    </TableStoreContext>
  )
}
