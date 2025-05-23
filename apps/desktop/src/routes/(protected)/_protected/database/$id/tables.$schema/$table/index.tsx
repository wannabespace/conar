import type { PageSize } from '~/components/table'
import type { WhereFilter } from '~/entities/database'
import { SQL_OPERATORS_LIST } from '@connnect/shared/utils/sql'
import { title } from '@connnect/shared/utils/title'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use, useEffect, useState } from 'react'
import { FiltersProvider } from '~/components/table'
import { ensureDatabaseTableCore } from '~/entities/database'
import { Filters } from './-components/filters'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { Table } from './-components/table'
import { useColumnsQuery } from './-queries/use-columns-query'

interface TableStore {
  page: number
  pageSize: PageSize
  selected: number[]
  filters: WhereFilter[]
  orderBy?: Record<string, 'ASC' | 'DESC'>
  prompt: string
}

const TableStoreContext = createContext<Store<TableStore>>(null!)

export function useTableStoreContext() {
  return use(TableStoreContext)
}

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table/',
)({
  component: DatabaseTablePage,
  beforeLoad: async ({ context, params }) => {
    await ensureDatabaseTableCore(context.database, params.schema, params.table)
  },
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
          {
            title: title(`${params.schema}.${params.table}`, loaderData.database.name),
          },
        ]
      : [],
  }),
})

const storeState = type({
  'page': 'number > 0',
  'pageSize': 'number' as type.cast<PageSize>,
  'selected': 'number[]',
  'filters': type<WhereFilter>({
    column: 'string',
    operator: 'string',
    value: 'string',
  }).array(),
  'orderBy?': {
    '[string]': 'string' as type.cast<'ASC' | 'DESC'>,
  },
  'prompt': 'string',
})

function DatabaseTablePage() {
  const { table } = Route.useParams()
  const [store] = useState(() => {
    const state = storeState(JSON.parse(sessionStorage.getItem(`${table}-store`) ?? '{}'))

    return new Store<TableStore>(state instanceof type.errors
      ? {
          page: 1,
          pageSize: 50,
          selected: [],
          filters: [],
          prompt: '',
          orderBy: {},
        }
      : state)
  })

  useEffect(() => {
    return store.subscribe((state) => {
      sessionStorage.setItem(`${table}-store`, JSON.stringify(state.currentVal))
    })
  }, [])

  const { data: columns } = useColumnsQuery()

  return (
    <TableStoreContext value={store}>
      <FiltersProvider
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
      </FiltersProvider>
    </TableStoreContext>
  )
}
