import type { ColumnRenderer } from '~/components/table'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { DEFAULT_COLUMN_WIDTH, Table } from '~/components/table'
import { setSql, useDatabase } from '~/entities/database'
import { createCellUpdater } from '~/entities/database/components/cells-updater'
import { TableCell } from '~/entities/database/components/table-cell'
import { TableHeaderCell } from '~/entities/database/components/table-header-cell'
import { queryClient } from '~/main'
import { Route } from '..'
import { useColumnsQuery } from '../-queries/use-columns-query'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { SelectionCell, SelectionHeaderCell } from './table-selection'

const selectSymbol = Symbol('table-selection')

const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 160],
  ['float', 150],
  ['uuid', 290],
])

function TableComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
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

  const tableColumns = useMemo(() => {
    const sortedColumns: ColumnRenderer[] = columns
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        id: column.name,
        size: columnsSizeMap.get(column.type) ?? DEFAULT_COLUMN_WIDTH,
        cell: props => <TableCell value={rows[props.rowIndex][column.name]} column={column} onUpdate={updateCell} {...props} />,
        header: props => <TableHeaderCell column={column} {...props} />,
      }) satisfies ColumnRenderer)

    if (!!primaryKeys && primaryKeys.length > 0) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: SelectionCell,
        header: props => <SelectionHeaderCell data={rows} {...props} />,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [columns, rows, primaryKeys])

  return (
    <Table
      data={rows}
      columns={tableColumns}
      loading={isPending}
      error={error}
    />
  )
}

export {
  TableComponent as Table,
}
