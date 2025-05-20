import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { setSql, useDatabase } from '~/entities/database'
import { createCellUpdater, Table, TableBody, TableEmpty, TableError, TableHeader, TableSkeleton } from '~/entities/database/components/table'
import { queryClient } from '~/main'
import { Route, useTableStoreContext } from '..'
import { useColumnsQuery } from '../-queries/use-columns-query'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'

function TableComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const store = useTableStoreContext()
  const rowsQueryOpts = useRowsQueryOpts()
  const { data, error, isPending } = useQuery(rowsQueryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)
  const { data: columns } = useColumnsQuery()
  const rows = useMemo(() => data?.rows ?? [], [data])

  const setValue = (rowIndex: number, columnName: string, value: unknown) => {
    queryClient.setQueryData(rowsQueryOpts.queryKey, (oldData) => {
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
  }

  const saveValue = async (rowIndex: number, columnName: string, value: unknown) => {
    const primaryColumns = columns.filter(column => column.isPrimaryKey)

    if (primaryColumns.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    const primaryKeys = primaryColumns.map(column => column.name)
    const primaryValues = primaryKeys.map(key => rows[rowIndex][key])

    await window.electron.databases.query({
      type: database.type,
      connectionString: database.connectionString,
      query: setSql(schema, table, columnName, primaryKeys)[database.type],
      values: [value, ...primaryValues],
    })
  }

  const updateCell = createCellUpdater({
    getValue: (rowIndex, columnName) => rows[rowIndex][columnName],
    setValue,
    saveValue,
  })

  return (
    <Table
      data={rows}
      columns={columns}
      selectable={!!primaryKeys && primaryKeys.length > 0}
      onUpdate={updateCell}
      onSelect={rows => store.setState(state => ({
        ...state,
        selected: rows,
      }))}
    >
      <TableHeader />
      {isPending
        ? <TableSkeleton />
        : error
          ? <TableError error={error} />
          : rows.length === 0
            ? <TableEmpty />
            : <TableBody />}
    </Table>
  )
}

export {
  TableComponent as Table,
}
