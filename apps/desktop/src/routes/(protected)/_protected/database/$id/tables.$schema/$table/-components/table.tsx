import type { Dispatch, SetStateAction } from 'react'
import type { columnType, databaseRowsQuery } from '~/entities/database'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { createCellUpdater, DataTable, useDatabase } from '~/entities/database'
import { setSql } from '~/entities/database/sql/set'
import { queryClient } from '~/main'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'

const cellUpdater = createCellUpdater()

export function Table({
  columns,
  selectedRows,
  setSelectedRows,
  rowsQueryOpts,
}: {
  columns: (typeof columnType.infer & { isPrimaryKey: boolean })[]
  selectedRows: Record<string, boolean>
  setSelectedRows: Dispatch<SetStateAction<Record<string, boolean>>>
  rowsQueryOpts: ReturnType<typeof databaseRowsQuery>
}) {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data, isPending } = useQuery(rowsQueryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

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
