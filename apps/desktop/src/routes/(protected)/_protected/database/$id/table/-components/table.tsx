import type { ColumnRenderer } from '~/components/table'
import { setSql } from '@conar/shared/sql/set'
import { RiErrorWarningLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useCallback, useEffect, useMemo } from 'react'
import { Table, TableBody, TableProvider } from '~/components/table'
import { databaseRowsQuery, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'
import { TableCell } from '~/entities/database/components/table-cell'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { Route } from '..'
import { columnsSizeMap, selectSymbol } from '../-lib'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'

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
  const columns = useTableColumns({ database, table, schema })
  const store = usePageStoreContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { data: rows, error, isPending: isRowsPending } = useInfiniteQuery(
    databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }),
  )
  const primaryColumns = useMemo(() => columns?.filter(c => c.primaryKey).map(c => c.id) ?? [], [columns])

  useEffect(() => {
    if (!rows || !store.state.selected)
      return

    const validSelected = store.state.selected.filter(selectedRow =>
      rows.some(row => primaryColumns.every(key => row[key] === selectedRow[key])),
    )

    store.setState(state => ({
      ...state,
      selected: validSelected,
    }))
  }, [store, rows, primaryColumns])

  const setValue = useCallback((rowIndex: number, columnName: string, value: unknown) => {
    const rowsQueryOpts = databaseRowsQuery({
      database,
      table,
      schema,
      query: {
        filters: store.state.filters,
        orderBy: store.state.orderBy,
      },
    })

    queryClient.setQueryData(rowsQueryOpts.queryKey, data => data
      ? ({
          ...data,
          pages: data.pages.map((page, pageIndex) => ({
            ...page,
            rows: page.rows.map((row, rIndex) => pageIndex * data.pages[0]!.rows.length + rIndex === rowIndex
              ? ({
                  ...row,
                  [columnName]: value,
                })
              : row),
          })),
        })
      : data)
  }, [database, table, schema, store])

  const saveValue = useCallback(async (rowIndex: number, columnId: string, value: unknown) => {
    const rowsQueryOpts = databaseRowsQuery({
      database,
      table,
      schema,
      query: {
        filters: store.state.filters,
        orderBy: store.state.orderBy,
      },
    })

    const data = queryClient.getQueryData(rowsQueryOpts.queryKey)

    if (!data)
      throw new Error('No data found. Please refresh the page.')

    if (primaryColumns.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    const rows = data.pages.flatMap(page => page.rows)

    const [result] = await dbQuery(database.id, {
      query: setSql(schema, table, columnId, primaryColumns)[database.type],
      values: [
        prepareValue(value, columns?.find(column => column.id === columnId)?.type),
        ...primaryColumns.map(key => rows[rowIndex]![key]),
      ],
    })

    const realValue = result!.rows[0]![columnId]

    if (value !== realValue)
      setValue(rowIndex, columnId, realValue)

    if (filters.length > 0 || Object.keys(orderBy).length > 0)
      queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })
  }, [database, table, schema, store, primaryColumns, setValue, columns, filters, orderBy])

  const setOrder = useCallback((columnId: string, order: 'ASC' | 'DESC') => {
    store.setState(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [columnId]: order,
      },
    }))
  }, [store])

  const removeOrder = useCallback((columnId: string) => {
    const newOrderBy = { ...store.state.orderBy }

    delete newOrderBy[columnId]

    store.setState(state => ({
      ...state,
      orderBy: newOrderBy,
    }))
  }, [store])

  const onSort = useCallback((columnId: string) => {
    const currentOrder = store.state.orderBy?.[columnId]

    if (currentOrder === 'ASC') {
      setOrder(columnId, 'DESC')
    }
    else if (currentOrder === 'DESC') {
      removeOrder(columnId)
    }
    else {
      setOrder(columnId, 'ASC')
    }
  }, [store, setOrder, removeOrder])

  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .filter(column => !hiddenColumns.includes(column.id))
      .toSorted((a, b) => a.primaryKey ? -1 : b.primaryKey ? 1 : 0)
      .map(column => ({
        id: column.id,
        size: columnsSizeMap.get(column.type) ?? DEFAULT_COLUMN_WIDTH,
        cell: props => (
          <TableCell
            column={column}
            onSetValue={setValue}
            onSaveValue={saveValue}
            {...props}
          />
        ),
        header: props => (
          <TableHeaderCell
            column={column}
            onSort={() => onSort(column.id)}
            {...props}
          />
        ),
      }) satisfies ColumnRenderer)

    if (primaryColumns.length > 0 && hiddenColumns.length !== columns.length) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: props => <SelectionCell keys={primaryColumns} {...props} />,
        header: props => <SelectionHeaderCell keys={primaryColumns} {...props} />,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [columns, hiddenColumns, primaryColumns, setValue, saveValue, onSort])

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
            ? <TableBodySkeleton selectable={primaryColumns.length > 0} />
            : error
              ? <TableError error={error} />
              : rows?.length === 0
                ? <TableEmpty className="bottom-0 h-[calc(100%-5rem)]" title="Table is empty" description="There are no records to show" />
                : tableColumns.length === 0
                  ? <TableEmpty className="h-[calc(100%-5rem)]" title="No columns to show" description="Please show at least one column" />
                  : (
                      <>
                        <TableBody data-mask className="bg-background" />
                        <TableInfiniteLoader
                          table={table}
                          schema={schema}
                          database={database}
                          filters={filters}
                          orderBy={orderBy}
                        />
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
