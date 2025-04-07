import type { PageSize } from '~/entities/database'
import { title } from '@connnect/shared/utils/title'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createContext, useEffect, useMemo, useState } from 'react'
import { databaseColumnsQuery, databasePrimaryKeysQuery, databaseQuery, databaseRowsQuery, DataTable, useDatabase } from '~/entities/database'
import { createCellUpdater } from '~/entities/database/components/table'
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
        title: title(params.table, params.schema, loaderData.database.name),
      },
    ],
  }),
})

export const TableContext = createContext<{
  page: number
  setPage: (page: number) => void
  pageSize: PageSize
  setPageSize: (pageSize: PageSize) => void
  total: number | null
}>(null!)

const cellUpdater = createCellUpdater()

function RouteComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const queryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })
  const { data, isPending, status } = useQuery(queryOpts)
  const { data: primaryKeys } = useQuery({
    ...databasePrimaryKeysQuery(database),
    select: data => data.find(key => key.table === table && key.schema === schema)?.primaryKeys,
  })
  const { data: databaseColumns } = useQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: (data) => {
      return data.map(column => ({
        ...column,
        isPrimaryKey: !!primaryKeys?.includes(column.name),
      }))
    },
  })

  const [total, setTotal] = useState(data?.total ?? null)

  useEffect(() => {
    if (status === 'success') {
      setTotal(data.total)
    }
  }, [status])

  const rows = data?.rows ?? []
  const columns = databaseColumns ?? []

  const context = useMemo(() => ({
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
  }), [page, setPage, pageSize, setPageSize, total])

  const updateCell = cellUpdater({
    setValue: (rowIndex: number, columnIndex: number, value: string | null) => {
      queryClient.setQueryData(queryOpts.queryKey, (oldData) => {
        if (!oldData)
          return oldData

        const newRows = [...oldData.rows]

        newRows[rowIndex] = { ...newRows[rowIndex] }
        newRows[rowIndex][columns[columnIndex].name] = value

        return {
          ...oldData,
          rows: newRows,
        }
      })
    },
    getValue: (rowIndex: number, columnIndex: number) => {
      return rows[rowIndex][columns[columnIndex].name] as string | null
    },
    saveValue: async (rowIndex: number, columnIndex: number, value: string | null) => {
      const where = databaseColumns!.filter(column => column.isPrimaryKey)

      if (where.length === 0)
        throw new Error('No primary keys found. Please use SQL Runner to update this row.')

      await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          UPDATE ${schema}.${table}
          SET ${columns[columnIndex].name} = $1
          WHERE ${where.map((column, index) => `${column.name} = $${index + 2}`).join(' AND ')}
        `,
        values: [value, ...where.map(column => rows[rowIndex][column.name] as string)],
      })
    },
  })

  return (
    <TableContext value={context}>
      <div className="h-screen flex flex-col justify-between">
        <TableHeader
          queryKey={queryOpts.queryKey}
          columnsCount={columns.length}
        />
        <div className="flex-1 overflow-hidden">
          <DataTable
            key={`${table}-${page}-${pageSize}`}
            loading={isPending}
            data={rows}
            columns={columns}
            className="h-full"
            updateCell={updateCell}
          />
        </div>
        <TableFooter />
      </div>
    </TableContext>
  )
}
