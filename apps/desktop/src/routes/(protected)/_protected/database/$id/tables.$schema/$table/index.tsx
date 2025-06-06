import type { WhereFilter } from '~/entities/database'
import { SQL_OPERATORS_LIST } from '@conar/shared/utils/sql'
import { title } from '@conar/shared/utils/title'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { FiltersProvider } from '~/components/table'
import { prefetchDatabaseTableCore, useDatabase } from '~/entities/database'
import { Filters } from './-components/filters'
import { Header } from './-components/header'
import { Table } from './-components/table'
import { useColumnsQuery } from './-queries/use-columns-query'

const storeState = type({
  selected: 'number[]',
  filters: type<WhereFilter>({
    column: 'string',
    operator: 'string',
    value: 'string',
  }).array(),
  hiddenColumns: 'string[]',
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

interface PageStore {
  selected: number[]
  filters: WhereFilter[]
  hiddenColumns: string[]
  orderBy: Record<string, 'ASC' | 'DESC'>
  prompt: string
}

const PageContext = createContext<{
  store: Store<PageStore>
}>(null!)

export function usePageContext() {
  return use(PageContext)
}

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table/',
)({
  component: DatabaseTablePage,
  beforeLoad: ({ context, params }) => {
    const parsed = getTableStoreState(params.schema, params.table)

    prefetchDatabaseTableCore(context.database, params.schema, params.table, {
      filters: parsed?.filters ?? [],
      orderBy: parsed?.orderBy ?? {},
    })
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

function DatabaseTablePage() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [store] = useState(() => {
    const state = getTableStoreState(schema, table)

    return new Store<PageStore>(state
      ?? {
        selected: [],
        filters: [],
        prompt: '',
        hiddenColumns: [],
        orderBy: {},
      })
  })

  useEffect(() => {
    return store.subscribe((state) => {
      sessionStorage.setItem(`${schema}.${table}-store`, JSON.stringify(state.currentVal))
    })
  }, [])

  const { data: columns } = useColumnsQuery(database, table, schema)

  const context = useMemo(() => ({
    store,
  }), [store])

  return (
    <PageContext value={context}>
      <FiltersProvider
        columns={columns ?? []}
        operators={SQL_OPERATORS_LIST}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="flex flex-col gap-4 px-4 pt-2 pb-4">
            <Header
              database={database}
              table={table}
              schema={schema}
            />
            <Filters />
          </div>
          <div className="flex-1 overflow-hidden">
            <Table />
          </div>
        </div>
      </FiltersProvider>
    </PageContext>
  )
}
