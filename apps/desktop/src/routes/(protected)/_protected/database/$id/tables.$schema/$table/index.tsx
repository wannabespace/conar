import type { PageSize } from '~/entities/database'
import { title } from '@connnect/shared/utils/title'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Store, useStore } from '@tanstack/react-store'
import { useMemo, useState } from 'react'
import { databaseColumnsQuery, databasePrimaryKeysQuery, databaseQuery, databaseRowsQuery, DataTable, useDatabase } from '~/entities/database'
import { createCellUpdater } from '~/entities/database/components/table'
import { setSql } from '~/entities/database/sql/set'
import { queryClient } from '~/main'
import { TableFooter } from './-components/footer'
import { TableHeader } from './-components/header'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables/$schema/$table/',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))
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

export const tableStore = new Store<{
  page: number
  pageSize: PageSize
}>({
  page: 1,
  pageSize: 50,
})

const cellUpdater = createCellUpdater()

function RouteComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
  const [page, pageSize] = useStore(tableStore, state => [state.page, state.pageSize])
  const queryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })
  const { data, isPending } = useQuery(queryOpts)
  const { data: primaryKeys } = useQuery({
    ...databasePrimaryKeysQuery(database),
    select: data => data.find(key => key.table === table && key.schema === schema)?.primaryKeys,
  })
  const { data: databaseColumns } = useQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })),
  })

  const selectedRowsPrimaryKeys = useMemo(() => {
    if (!primaryKeys?.length || !data?.rows)
      return []

    return Object.keys(selectedRows)
      .filter(index => data.rows[Number(index)])
      .map((index) => {
        const row = data.rows[Number(index)]

        return primaryKeys.reduce((acc, key) => {
          acc[key] = row[key]
          return acc
        }, {} as Record<string, unknown>)
      })
  }, [selectedRows, primaryKeys, data?.rows])

  const rows = data?.rows ?? []
  const columns = databaseColumns ?? []

  const updateCell = cellUpdater({
    setValue: (rowIndex: number, columnName: string, value: string | null) => {
      queryClient.setQueryData(queryOpts.queryKey, (oldData) => {
        if (!oldData)
          return oldData

        const newRows = [...oldData.rows]

        newRows[rowIndex] = { ...newRows[rowIndex] }
        newRows[rowIndex][columnName] = value

        return {
          ...oldData,
          rows: newRows,
        }
      })
    },
    getValue: (rowIndex: number, columnName: string) => {
      return rows[rowIndex][columnName] as string | null
    },
    saveValue: async (rowIndex: number, columnName: string, value: string | null) => {
      const primaryColumns = databaseColumns!.filter(column => column.isPrimaryKey)

      if (primaryColumns.length === 0)
        throw new Error('No primary keys found. Please use SQL Runner to update this row.')

      await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: setSql(schema, table, columnName, primaryColumns.map(column => column.name))[database.type],
        values: [value, ...primaryColumns.map(column => rows[rowIndex][column.name] as string)],
      })
    },
  })

  return (
    <div className="h-screen flex flex-col justify-between">
      <TableHeader
        queryKey={queryOpts.queryKey}
        columnsCount={columns.length}
        selected={selectedRowsPrimaryKeys}
        clearSelected={() => setSelectedRows({})}
      />
      <div className="flex-1 overflow-hidden">
        <DataTable
          loading={isPending}
          data={rows}
          columns={columns}
          className="h-full"
          updateCell={updateCell}
          selectable={!!primaryKeys && primaryKeys.length > 0}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      </div>
      <TableFooter />
    </div>
  )
}
