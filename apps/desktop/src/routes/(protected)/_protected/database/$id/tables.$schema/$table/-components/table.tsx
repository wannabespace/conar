import type { ColumnRenderer } from '~/components/table'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { DEFAULT_COLUMN_WIDTH, Table, TableBody, TableEmpty, TableError, TableHeader } from '~/components/table'
import { setSql, useDatabase } from '~/entities/database'
import { createCellUpdater } from '~/entities/database/components/cells-updater'
import { TableCell } from '~/entities/database/components/table-cell'
import { queryClient } from '~/main'
import { Route } from '..'
import { useColumnsQuery } from '../-queries/use-columns-query'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { TableHeaderCell } from './table-header-cell'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton, TableHeaderSkeleton } from './table-skeleton'

const selectSymbol = Symbol('table-selection')

const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 160],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 150],
  ['uuid', 290],
])

function TableComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const rowsQueryOpts = useRowsQueryOpts()
  const { data: columns, isPending: isColumnsPending } = useColumnsQuery()
  const { data: rows, error, isPending: isRowsPending } = useQuery({
    ...rowsQueryOpts,
    select: data => data?.rows ?? [],
  })
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const selectable = useMemo(() => !!primaryKeys && primaryKeys.length > 0, [primaryKeys])

  const setValue = (rowIndex: number, columnName: string, value: unknown) => {
    queryClient.setQueryData(rowsQueryOpts.queryKey, (oldData) => {
      if (!oldData)
        return oldData

      const newRows = [...oldData.rows]

      newRows[rowIndex] = { ...newRows[rowIndex] }
      newRows[rowIndex][columnName] = value

      return { ...oldData, rows: newRows }
    })
  }

  const saveValue = async (rowIndex: number, columnName: string, value: unknown) => {
    const data = queryClient.getQueryData(rowsQueryOpts.queryKey)

    if (!data)
      throw new Error('No data found. Please refresh the page.')

    if (!primaryKeys || primaryKeys.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    await window.electron.databases.query({
      type: database.type,
      connectionString: database.connectionString,
      query: setSql(schema, table, columnName, primaryKeys)[database.type],
      values: [value, ...primaryKeys.map(key => data.rows[rowIndex][key])],
    })
  }

  const updateCell = createCellUpdater({
    setValue,
    saveValue,
  })

  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        id: column.name,
        size: columnsSizeMap.get(column.type) ?? DEFAULT_COLUMN_WIDTH,
        cell: props => (
          <TableCell
            column={column}
            onUpdate={updateCell}
            {...props}
          />
        ),
        header: props => <TableHeaderCell column={column} {...props} />,
      }) satisfies ColumnRenderer)

    if (selectable) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: SelectionCell,
        header: SelectionHeaderCell,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [columns, selectable])

  return (
    <Table
      rows={rows ?? []}
      columns={tableColumns}
    >
      {isColumnsPending ? <TableHeaderSkeleton /> : <TableHeader />}
      {isRowsPending || isColumnsPending
        ? <TableBodySkeleton />
        : error
          ? <TableError error={error} />
          : rows?.length === 0
            ? <TableEmpty />
            : <TableBody />}
    </Table>
  )
}

export {
  TableComponent as Table,
}
