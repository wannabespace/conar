import { getRouteApi } from '@tanstack/react-router'

import { openTableTab } from '~/entities/connection/store'

import { Table } from './-components/table/table'
import { TableToolbar } from './-components/toolbar/toolbar'
import { ColumnsContext, useTableColumnsQuery } from './-lib/columns'
import {
  tableSessionStore,
  TableSessionStoreContext,
} from './-lib/session-store'
import { tablePageStore, TablePageStoreContext } from './-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TableContent = ({ table, schema }: { table: string; schema: string }) => {
  const { connectionResource } = useRouteContext()
  const { data = [], isPending } = useTableColumnsQuery({
    connectionResource,
    table,
    schema,
  })

  return (
    <ColumnsContext value={{ columns: data, isPending }}>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        onClick={() => openTableTab(connectionResource.id, schema, table)}
      >
        <div className="relative min-h-0 flex-1">
          <Table table={table} schema={schema} />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-col items-center">
            <TableToolbar table={table} schema={schema} />
          </div>
        </div>
      </div>
    </ColumnsContext>
  )
}

export const TableTab = ({
  schema,
  table,
}: {
  schema: string
  table: string
}) => {
  const { connectionResource } = useRouteContext()
  const storeKey = { id: connectionResource.id, schema, table }

  return (
    <TablePageStoreContext value={tablePageStore(storeKey)}>
      <TableSessionStoreContext value={tableSessionStore(storeKey)}>
        <TableContent table={table} schema={schema} />
      </TableSessionStoreContext>
    </TablePageStoreContext>
  )
}
