import type { ActiveFilter } from '@conar/shared/filters'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'
import { addTab, getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore, prefetchConnectionResourceTableCore } from '~/entities/connection/utils'
import { ColumnsContext, useTableColumnsQuery } from './-columns'
import { Filters } from './-components/filters/filters'
import { Header } from './-components/header/header'
import { Sidebar } from './-components/sidebar'
import { Table } from './-components/table/table'
import { TablesTabs } from './-components/tabs'
import { tablePageStore, TablePageStoreContext } from './-store'

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
    prefetchConnectionResourceCore(context.connectionResource)

    if (deps.table && deps.schema) {
      const state = tablePageStore({ id: context.connectionResource.id, schema: deps.schema, table: deps.table }).get()

      prefetchConnectionResourceTableCore({
        connectionResource: context.connectionResource,
        schema: deps.schema,
        table: deps.table,
        query: {
          filters: state.filters,
          orderBy: state.orderBy,
          exact: state.exact,
        },
      })
    }

    return {
      connection: context.connection,
      connectionResource: context.connectionResource,
      schema: deps.schema ?? null,
      table: deps.table ?? null,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{
          title: title(
            loaderData.schema && loaderData.table ? `${loaderData.schema}.${loaderData.table}` : 'Tables',
            loaderData.connection.name,
            loaderData.connectionResource.name,
          ),
        }]
      : [],
  }),
})

// eslint-disable-next-line react-refresh/only-export-components
function TableContent({ table, schema }: { table: string, schema: string }) {
  const { connectionResource } = Route.useRouteContext()
  const { data = [] } = useTableColumnsQuery({ connectionResource, table, schema })

  return (
    <ColumnsContext value={data}>
      <TablesTabs className="h-9" />
      <div
        className="h-[calc(100%-(--spacing(9)))]"
        onClick={() => addTab(connectionResource.id, schema, table)}
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
      </div>
    </ColumnsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function DatabaseTablesPage() {
  const { connectionResource } = Route.useRouteContext()
  const { schema, table } = Route.useSearch()
  const store = getConnectionResourceStore(connectionResource.id)
  const lastOpenedTable = useSubscription(store, { selector: state => state.lastOpenedTable })

  const handleLastOpenedTableEvent = useEffectEvent(() => {
    if (schema && table) {
      if (schema !== lastOpenedTable?.schema || table !== lastOpenedTable?.table) {
        store.set(state => ({
          ...state,
          lastOpenedTable: { schema, table },
        } satisfies typeof state))
      }
    }
    else if (lastOpenedTable !== null) {
      store.set(state => ({
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
        className="h-full overflow-hidden rounded-lg bg-background"
      >
        <Sidebar key={connectionResource.id} />
      </ResizablePanel>
      <ResizableSeparator className="w-1 bg-transparent" />
      <ResizablePanel
        defaultSize="80%"
        className="flex-1 overflow-hidden rounded-lg bg-background"
      >
        {schema && table
          ? (
              <TablePageStoreContext value={tablePageStore({ id: connectionResource.id, schema, table })}>
                <TableContent
                  table={table}
                  schema={schema}
                />
              </TablePageStoreContext>
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
