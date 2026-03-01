import type { ActiveFilter } from '@conar/shared/filters'
import type { Store } from '@tanstack/react-store'
import type { storeState } from './-store'
import { SQL_FILTERS_GROUPED } from '@conar/shared/filters'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { addTab, getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore, prefetchConnectionResourceTableCore } from '~/entities/connection/utils'
import { Filters } from './-components/filters/filters'
import { FiltersProvider } from './-components/filters/filters-provider'
import { Header } from './-components/header/header'
import { Sidebar } from './-components/sidebar'
import { Table } from './-components/table/table'
import { TablesTabs } from './-components/tabs'
import { useTableColumns } from './-queries/use-columns-query'
import { PageStoreContext, tablePageStore } from './-store'

export const Route = createFileRoute(
  '/_protected/connection/$resourceId/table/',
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
    const store = deps.table && deps.schema ? tablePageStore({ id: context.connectionResource.id, schema: deps.schema, table: deps.table }) : null

    prefetchConnectionResourceCore(context.connectionResource)

    if (store) {
      prefetchConnectionResourceTableCore({
        connectionResource: context.connectionResource,
        schema: deps.schema!,
        table: deps.table!,
        query: {
          filters: store.state.filters,
          orderBy: store.state.orderBy,
          exact: store.state.exact,
        },
      })
    }

    return {
      connection: context.connection,
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
            loaderData.connection.name,
          ),
        }]
      : [],
  }),
})

function TableContent({ table, schema, store }: { table: string, schema: string, store: Store<typeof storeState.infer> }) {
  const { connectionResource } = Route.useRouteContext()
  const deps = Route.useLoaderDeps()

  const resetSelectionStateEvent = useEffectEvent(() => {
    store.setState(state => ({
      ...state,
      lastClickedIndex: null,
      selectionState: { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
    } satisfies typeof state))
  })

  useEffect(() => {
    resetSelectionStateEvent()
  }, [table, schema, store])

  useEffect(() => {
    if (deps.filters || deps.orderBy) {
      store.setState(state => ({
        ...state,
        ...(deps.filters ? { filters: deps.filters } : {}),
        ...(deps.orderBy ? { orderBy: deps.orderBy } : {}),
      } satisfies typeof state))
    }
  }, [store, deps])

  const columns = useTableColumns({ connectionResource, table, schema })

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
      <TablesTabs className="h-9" />
      <div
        key={table}
        role="none"
        className="h-[calc(100%-(--spacing(9)))]"
        onClick={() => addTab(connectionResource.id, schema, table)}
      >
        <FiltersProvider
          columns={columns ?? []}
          filtersGrouped={SQL_FILTERS_GROUPED}
        >
          <div className="flex h-full flex-col justify-between">
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
  const { store: tableStore } = Route.useLoaderData()
  const { connectionResource } = Route.useRouteContext()
  const { schema, table } = Route.useSearch()
  const store = getConnectionResourceStore(connectionResource.id)
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

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `database-table-layout-${connectionResource.id}`,
    storage: localStorage,
  })

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      orientation="horizontal"
      className="flex"
    >
      <ResizablePanel
        defaultSize="20%"
        minSize={200}
        maxSize="50%"
        className="h-full overflow-hidden rounded-lg border bg-background"
      >
        <Sidebar key={connectionResource.id} />
      </ResizablePanel>
      <ResizableSeparator className="w-1 bg-transparent" />
      <ResizablePanel
        defaultSize="80%"
        className="flex-1 overflow-hidden rounded-lg border bg-background"
      >
        {schema && table && tableStore
          ? (
              <TableContent
                table={table}
                schema={schema}
                store={tableStore}
              />
            )
          : (
              <div className="flex h-full items-center justify-center p-4">
                <div className="space-y-4 text-center">
                  <div className="text-lg font-medium">
                    No table selected
                  </div>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    Select a schema from the dropdown and choose a table from the sidebar to view and manage your data.
                  </p>
                </div>
              </div>
            )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
