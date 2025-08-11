import type { ColumnRenderer } from '~/components/table'
import { setSql } from '@conar/shared/sql/set'
import { RiErrorWarningLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo } from 'react'
import { Table, TableBody, TableProvider } from '~/components/table'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'
import { TableCell } from '~/entities/database/components/table-cell'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { Route } from '..'
import { getRowsQueryOpts } from '../-lib'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { usePageStoreContext } from '../-store'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'

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

function prepareValue(value: unknown, type?: string): unknown {
  if (!type)
    return value

  return typeof value === 'string' && type.endsWith('[]') ? JSON.parse(value) : value
}

export function TableError({ error }: { error: Error }) {
  return (
    <div className="sticky left-0 pointer-events-none h-full flex items-center pb-10 justify-center">
      <div className="flex flex-col items-center p-4 bg-card rounded-lg border max-w-md">
        <div className="flex items-center gap-1 text-destructive mb-2">
          <RiErrorWarningLine className="size-4" />
          <span>Error occurred</span>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          {error.message}
        </p>
      </div>
    </div>
  )
}

function TableComponent({ table, schema }: { table: string, schema: string }) {
  const { database } = Route.useLoaderData()
  const columns = useTableColumns(database, table, schema)
  const store = usePageStoreContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { data: rows, error, isPending: isRowsPending } = useInfiniteQuery(
    getRowsQueryOpts({ database, table, schema, filters, orderBy }),
  )
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  useEffect(() => {
    if (!rows || !primaryKeys || !store.state.selected)
      return

    const validSelected = store.state.selected.filter(selectedRow =>
      rows.some(row => primaryKeys.every(key => row[key] === selectedRow[key])),
    )

    store.setState(state => ({
      ...state,
      selected: validSelected,
    }))
  }, [rows, primaryKeys])

  const selectable = !!primaryKeys && primaryKeys.length > 0

  const setValue = (rowIndex: number, columnName: string, value: unknown) => {
    const rowsQueryOpts = getRowsQueryOpts({
      database,
      table,
      schema,
      filters: store.state.filters,
      orderBy: store.state.orderBy,
    })

    queryClient.setQueryData(rowsQueryOpts.queryKey, data => data
      ? ({
          ...data,
          pages: data.pages.map((page, pageIndex) => ({
            ...page,
            rows: page.rows.map((row, rIndex) => pageIndex * data.pages[0].rows.length + rIndex === rowIndex
              ? ({
                  ...row,
                  [columnName]: value,
                })
              : row),
          })),
        })
      : data)
  }

  const saveValue = async (rowIndex: number, columnName: string, value: unknown) => {
    const rowsQueryOpts = getRowsQueryOpts({
      database,
      table,
      schema,
      filters: store.state.filters,
      orderBy: store.state.orderBy,
    })

    const data = queryClient.getQueryData(rowsQueryOpts.queryKey)

    if (!data)
      throw new Error('No data found. Please refresh the page.')

    if (!primaryKeys || primaryKeys.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    const rows = data.pages.flatMap(page => page.rows)

    const [{ rows: [{ [columnName]: realValue }] }] = await dbQuery({
      type: database.type,
      connectionString: database.connectionString,
      query: setSql(schema, table, columnName, primaryKeys)[database.type],
      values: [
        prepareValue(value, columns?.find(column => column.name === columnName)?.type),
        ...primaryKeys.map(key => rows[rowIndex][key]),
      ],
    })

    if (value !== realValue)
      setValue(rowIndex, columnName, realValue)

    if (filters.length > 0 || Object.keys(orderBy).length > 0)
      queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })
  }

  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .filter(column => !hiddenColumns.includes(column.name))
      .toSorted((a, b) => a.isPrimaryKey ? -1 : b.isPrimaryKey ? 1 : 0)
      .map(column => ({
        id: column.name,
        size: columnsSizeMap.get(column.type) ?? DEFAULT_COLUMN_WIDTH,
        cell: props => (
          <TableCell
            column={column}
            onSetValue={setValue}
            onSaveValue={saveValue}
            {...props}
          />
        ),
        header: props => <TableHeaderCell column={column} {...props} />,
      }) satisfies ColumnRenderer)

    if (selectable && hiddenColumns.length !== columns.length) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: props => <SelectionCell keys={primaryKeys} {...props} />,
        header: props => <SelectionHeaderCell keys={primaryKeys} {...props} />,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [columns, hiddenColumns, selectable])

  return (
    <TableProvider
      rows={rows ?? []}
      columns={tableColumns}
      estimatedRowSize={DEFAULT_ROW_HEIGHT}
      estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
    >
      <div className="size-full relative bg-background">
        <Table>
          <TableHeader />
          {isRowsPending
            ? <TableBodySkeleton selectable={selectable} />
            : error
              ? <TableError error={error} />
              : rows?.length === 0
                ? <TableEmpty className="bottom-0 h-[calc(100%-5rem)]" title="Table is empty" description="There are no records to show" />
                : tableColumns.length === 0
                  ? <TableEmpty className="h-[calc(100%-5rem)]" title="No columns to show" description="Please show at least one column" />
                  : (
                      <>
                        <TableBody data-mask className="bg-background" />
                        <TableInfiniteLoader table={table} schema={schema} database={database} />
                      </>
                    )}
        </Table>
      </div>
    </TableProvider>
  )
}

export {
  TableComponent as Table,
}
