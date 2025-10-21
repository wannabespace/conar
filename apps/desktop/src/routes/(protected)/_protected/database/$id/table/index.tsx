import type { ActiveFilter } from '@conar/shared/filters'
import type { Store } from '@tanstack/react-store'
import type { storeState } from './-store'
import { SQL_FILTERS_GROUPED } from '@conar/shared/filters/sql'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'
import { FiltersProvider } from '~/components/table'
import { prefetchDatabaseCore, prefetchDatabaseTableCore } from '~/entities/database'
import { addTab, databaseStore } from '../../-store'
import { Filters } from './-components/filters'
import { Header } from './-components/header'
import { Sidebar } from './-components/sidebar'
import { Table } from './-components/table'
import { TablesTabs } from './-components/tabs'
import { useTableColumns } from './-queries/use-columns-query'
import { createPageStore, PageStoreContext } from './-store'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/table/',
)({
  validateSearch: type({
    'schema?': 'string',
    'table?': 'string',
    'filters?': 'object[]' as type.cast<ActiveFilter[]>,
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
      } satisfies typeof state))
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

  const removeUnusedOrdersEvent = useEffectEvent(() => {
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
    } satisfies typeof state))
  })

  useEffect(() => {
    removeUnusedOrdersEvent()
  }, [columns, store])

  return (
    <PageStoreContext value={store}>
      <TablesTabs className="h-9" database={database} />
      <div
        key={table}
        className="h-[calc(100%-(--spacing(9)))]"
        onClick={() => addTab(database.id, schema, table)}
      >
        <FiltersProvider
          columns={columns ?? []}
          filtersGrouped={SQL_FILTERS_GROUPED}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-4 px-4 pt-2 pb-4">
              <Header table={table} schema={schema} />
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
  const { database, store: tableStore } = Route.useLoaderData()
  const { schema, table } = Route.useSearch()
  const store = databaseStore(database.id)
  const lastOpenedTable = useStore(store, state => state.lastOpenedTable)

  const handleLastOpenedTableEvent = useEffectEvent(() => {
    if (schema && table) {
      if (schema !== lastOpenedTable?.schema || table !== lastOpenedTable?.table) {
        store.setState(state => ({
          ...state,
          lastOpenedTable: { schema, table },
        } satisfies typeof state))
      }
    }
    else if (lastOpenedTable !== null) {
      store.setState(state => ({
        ...state,
        lastOpenedTable: null,
      } satisfies typeof state))
    }
  })

  useEffect(() => {
    handleLastOpenedTableEvent()
  }, [schema, table, lastOpenedTable])

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${database.id}`} direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="h-full border bg-background rounded-lg"
      >
        <Sidebar key={database.id} />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-transparent" />
      <ResizablePanel defaultSize={80} className="flex-1 border bg-background rounded-lg">
        {schema && table && tableStore
          ? (
              <TableContent
                table={table}
                schema={schema}
                store={tableStore}
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
