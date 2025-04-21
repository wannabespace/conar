import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { createCellUpdater, databaseRowsQuery, DataTable, useDatabase } from '~/entities/database'
import { setSql } from '~/entities/database/sql/set'
import { queryClient } from '~/main'
import { useTableContext } from '..'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'

const cellUpdater = createCellUpdater()

export function Table() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { page, pageSize, selectedRows, columns, setSelectedRows } = useTableContext()
  const queryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })
  const { data, isPending } = useQuery(queryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const rows = useMemo(() => data?.rows ?? [], [data])

  const setValue = (rowIndex: number, columnName: string, value: unknown) => {
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
  }

  const saveValue = async (rowIndex: number, columnName: string, value: unknown) => {
    const primaryColumns = columns.filter(column => column.isPrimaryKey)

    if (primaryColumns.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    await window.electron.databases.query({
      type: database.type,
      connectionString: database.connectionString,
      query: setSql(schema, table, columnName, primaryColumns.map(column => column.name))[database.type],
      values: [value, ...primaryColumns.map(column => rows[rowIndex][column.name] as string)],
    })
  }

  const updateCell = cellUpdater({
    setValue,
    getValue: (rowIndex, columnName) => rows[rowIndex][columnName],
    saveValue,
  })

  return (
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
  )
}
