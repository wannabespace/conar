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

interface PageStore {
  page: number
  pageSize: PageSize
  selected: number[]
  filters: WhereFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
  prompt: string
}

const PageStoreContext = createContext<Store<PageStore>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
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
  page: 'number > 0',
  pageSize: 'number' as type.cast<PageSize>,
  selected: 'number[]',
  filters: type<WhereFilter>({
    column: 'string',
    operator: 'string',
    value: 'string',
  }).array(),
  orderBy: {
    '[string]': 'string' as type.cast<'ASC' | 'DESC'>,
  },
  prompt: 'string',
})

export function getTableStoreState(schema: string, table: string) {
  const parsed = storeState(JSON.parse(sessionStorage.getItem(`${schema}.${table}-store`) ?? '{}'))

  if (parsed instanceof type.errors)
    return null

  return parsed
}

function DatabaseTablePage() {
  const { table, schema } = Route.useParams()
  const [store] = useState(() => {
    const state = getTableStoreState(schema, table)

    return new Store<PageStore>(state
      ?? {
        page: 1,
        pageSize: 50,
        selected: [],
        filters: [],
        prompt: '',
        orderBy: {},
      })
  })

  useEffect(() => {
    return store.subscribe((state) => {
      sessionStorage.setItem(`${schema}.${table}-store`, JSON.stringify(state.currentVal))
    })
  }, [])

  const { data: columns } = useColumnsQuery()

  return (
    <PageStoreContext value={store}>
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
    </PageStoreContext>
  )
}
