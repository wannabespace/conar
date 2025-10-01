import type { WhereFilter } from '@conar/shared/sql/where'
import type { Store } from '@tanstack/react-store'
import type { storeState } from './-store'
import { FILTER_OPERATORS_LIST } from '@conar/shared/utils/sql'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { FiltersProvider } from '~/components/table'
import { prefetchDatabaseCore, prefetchDatabaseTableCore, useLastOpenedTable } from '~/entities/database'
import { Filters } from './-components/filters'
import { Header } from './-components/header'
import { Sidebar } from './-components/sidebar'
import { Table } from './-components/table'
import { TablesTabs } from './-components/tabs'
import { useTableColumns } from './-queries/use-columns-query'
import { createPageStore, PageStoreContext } from './-store'
import { addTab } from './-tabs'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/table/',
)({
  validateSearch: type({
    'schema?': 'string',
    'table?': 'string',
    'filters?': 'object[]' as type.cast<WhereFilter[]>,
    'orderBy?': 'object' as type.cast<Record<string, 'ASC' | 'DESC'>>,
  }),
  component: DatabaseTablesPage,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const store = deps.table && deps.schema ? createPageStore({ id: context.database.id, schema: deps.schema, table: deps.table }) : null

    if (store && (deps.filters || deps.orderBy)) {
      store.setState(state => ({
        ...state,
        ...(deps.filters ? { filters: deps.filters } : {}),
        ...(deps.orderBy ? { orderBy: deps.orderBy } : {}),
      }))
    }

    prefetchDatabaseCore(context.database)

    if (store) {
      prefetchDatabaseTableCore({
        database: context.database,
        schema: deps.schema!,
        table: deps.table!,
        query: {
          filters: store.state.filters ?? [],
          orderBy: store.state.orderBy ?? {},
        },
      })
    }

    return {
      database: context.database,
      schema: deps.schema ?? null,
      table: deps.table ?? null,
      store,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{
          title: title(
            loaderData.schema && loaderData.table ? `${loaderData.schema}.${loaderData.table}` : 'Tables',
            loaderData.database.name,
          ),
        }]
      : [],
  }),
})

function TableContent({ table, schema, store }: { table: string, schema: string, store: Store<typeof storeState.infer> }) {
  const { database } = Route.useLoaderData()

  const columns = useTableColumns({ database, table, schema })

  useEffect(() => {
    if (!columns || columns.length === 0)
      return

    const columnIds = columns.map(col => col.id)
    const invalidOrderByKeys = Object.keys(store.state.orderBy).filter(key => !columnIds.includes(key))

    if (invalidOrderByKeys.length === 0)
      return

    const newOrderBy = Object.fromEntries(
      Object.entries(store.state.orderBy).filter(([key]) => !invalidOrderByKeys.includes(key)),
    )

    store.setState(state => ({
      ...state,
      orderBy: newOrderBy,
    }))
  }, [columns, store])

  return (
    <PageStoreContext value={store}>
      <TablesTabs database={database} />
      <div
        key={table}
        className="h-[calc(100%-theme(spacing.9))]"
        onClick={() => addTab(database.id, schema, table)}
      >
        <FiltersProvider
          columns={columns ?? []}
          operators={FILTER_OPERATORS_LIST}
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
              <Table table={table} schema={schema} />
            </div>
          </div>
        </FiltersProvider>
      </div>
    </PageStoreContext>
  )
}

function DatabaseTablesPage() {
  const { database, store } = Route.useLoaderData()
  const { schema, table } = Route.useSearch()
  const [lastOpenedTable, setLastOpenedTable] = useLastOpenedTable(database.id)

  useEffect(() => {
    if (schema && table) {
      if (schema !== lastOpenedTable?.schema || table !== lastOpenedTable?.table) {
        setLastOpenedTable({ schema, table })
      }
    }
    else if (lastOpenedTable !== null) {
      setLastOpenedTable(null)
    }
  }, [schema, table, setLastOpenedTable, lastOpenedTable])

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${database.id}`} direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="flex flex-col h-full border bg-background rounded-lg"
      >
        <Sidebar key={database.id} database={database} />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-transparent" />
      <ResizablePanel defaultSize={80} className="flex-1 border bg-background rounded-lg">
        {schema && table && store
          ? (
              <TableContent
                table={table}
                schema={schema}
                store={store}
              />
            )
          : (
              <div className="p-4 flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="text-lg font-medium">
                    No table selected
                  </div>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Select a schema from the dropdown and choose a table from the sidebar to view and manage your data.
                  </p>
                </div>
              </div>
            )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
