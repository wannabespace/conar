import { RiTable2 } from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { enabledFilters } from '@tamery/shared/filters'
import { title } from '@tamery/shared/utils/title'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { motion } from 'motion/react'
import { useEffect, useEffectEvent } from 'react'
import { useSubscription } from 'seitu/react'

import { addTab, getConnectionResourceStore } from '~/entities/connection/store'
import {
  prefetchConnectionResourceCore,
  prefetchConnectionResourceTableCore,
} from '~/entities/connection/utils'

import { PageSidebar, TabBar, TableToolbar } from './-components/page'
import { Table } from './-components/table/table'
import { ColumnsContext, useTableColumnsQuery } from './-lib/columns'
import { tablePageStore, TablePageStoreContext } from './-lib/store'

export const Route = createFileRoute('/_protected/connection/$resourceId/table/')({
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
      const store = tablePageStore({
        id: context.connectionResource.id,
        schema: deps.schema,
        table: deps.table,
      })
      const state = store.get()

      if (deps.filters) {
        store.set(
          state =>
            ({
              ...state,
              filters: deps.filters!,
            }) satisfies typeof state,
        )
      }
      if (deps.orderBy) {
        store.set(
          state =>
            ({
              ...state,
              orderBy: deps.orderBy!,
            }) satisfies typeof state,
        )
      }

      prefetchConnectionResourceTableCore({
        connectionResource: context.connectionResource,
        schema: deps.schema,
        table: deps.table,
        query: {
          filters: enabledFilters(state.filters),
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
      ? [
          {
            title: title(
              loaderData.schema && loaderData.table
                ? `${loaderData.schema}.${loaderData.table}`
                : 'Tables',
              loaderData.connection.name,
              loaderData.connectionResource.name,
            ),
          },
        ]
      : [],
  }),
})

function TableContent({ table, schema }: { table: string; schema: string }) {
  const { connectionResource } = Route.useRouteContext()
  const { data = [], isPending } = useTableColumnsQuery({ connectionResource, table, schema })

  return (
    <ColumnsContext value={{ columns: data, isPending }}>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        onClick={() => addTab(connectionResource.id, schema, table)}
      >
        <div className="relative min-h-0 flex-1">
          <Table table={table} schema={schema} />
          <div
            className={`
              pointer-events-none absolute inset-x-3 bottom-3 z-20 flex
              flex-col items-center
            `}
          >
            <TableToolbar table={table} schema={schema} />
          </div>
        </div>
      </div>
    </ColumnsContext>
  )
}

function EmptyPane() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center text-center"
      >
        <div
          className={`
            mb-4 flex size-14 items-center justify-center rounded-2xl
            bg-muted/60
          `}
        >
          <RiTable2 className="size-7 text-muted-foreground/70" />
        </div>
        <div className="text-sm font-medium">No Table Selected</div>
        <p className="mt-1 max-w-64 text-xs text-muted-foreground">
          Choose a table from the sidebar to browse and edit its data.
        </p>
      </motion.div>
    </div>
  )
}

function DatabaseTablesPage() {
  const { connectionResource } = Route.useRouteContext()
  const { schema, table } = Route.useSearch()
  const store = getConnectionResourceStore(connectionResource.id)
  const lastOpenedTable = useSubscription(store, { selector: state => state.lastOpenedTable })

  const handleLastOpenedTableEvent = useEffectEvent(() => {
    if (schema && table) {
      if (schema !== lastOpenedTable?.schema || table !== lastOpenedTable?.table) {
        store.set(
          state =>
            ({
              ...state,
              lastOpenedTable: { schema, table },
            }) satisfies typeof state,
        )
      }
    } else if (lastOpenedTable !== null) {
      store.set(
        state =>
          ({
            ...state,
            lastOpenedTable: null,
          }) satisfies typeof state,
      )
    }
  })

  useEffect(() => {
    handleLastOpenedTableEvent()
  }, [schema, table, lastOpenedTable])

  return (
    <div className="flex h-full min-h-0 w-full">
      <PageSidebar key={connectionResource.id} />
      <div
        className={`
          flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border
          bg-background shadow-lg
        `}
      >
        <TabBar />
        {schema && table ? (
          <TablePageStoreContext
            value={tablePageStore({ id: connectionResource.id, schema, table })}
          >
            <TableContent table={table} schema={schema} />
          </TablePageStoreContext>
        ) : (
          <EmptyPane />
        )}
      </div>
    </div>
  )
}
