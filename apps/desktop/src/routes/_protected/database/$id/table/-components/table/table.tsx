import type { ColumnRenderer } from '@conar/table'
import type { Column } from '~/entities/connection/components/table/utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { Table, TableBody, TableProvider, useShiftSelectionKeyDown } from '@conar/table'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { TableCell } from '~/entities/connection/components'
import { connectionRowsQuery } from '~/entities/connection/queries'
import { useConnectionEnums } from '~/entities/connection/queries/enums'
import { findEnum, selectQuery, setQuery } from '~/entities/connection/sql'
import { queryClient } from '~/main'
import { Route } from '../..'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '../../-lib'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'
import { useColumnsOrder } from '../use-columns-order'
import { RenameColumnDialog } from './rename-column-dialog'
import { RowDetailSidebar } from './row-detail-sidebar'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'

function prepareValue(value: unknown, column?: Column): unknown {
  if (!column)
    return value

  return typeof value === 'string' && column.isArray
    ? JSON.parse(value)
    : value
}

export function TableError({ error }: { error: Error }) {
  return (
    <div className={`
      pointer-events-none sticky left-0 flex h-full items-center justify-center
      pb-10
    `}
    >
      <div className={`
        flex max-w-md flex-col items-center rounded-lg border bg-card p-4
      `}
      >
        <div className="mb-1 text-destructive">
          Error occurred
        </div>
        <p className="text-center font-mono text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    </div>
  )
}

function TableComponent({ table, schema }: { table: string, schema: string }) {
  const { connection } = Route.useLoaderData()
  const { data: enums } = useConnectionEnums({ connection })
  const columns = useTableColumns({ connection, table, schema })
  const store = usePageStoreContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const columnSizes = useStore(store, state => state.columnSizes)
  const detailRowIndex = useStore(store, state => state.detailRowIndex)
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { data: rows = [], error, isPending: isRowsPending } = useInfiniteQuery(connectionRowsQuery({ connection, table, schema, query: { filters, orderBy } }))
  const primaryColumns = useMemo(() => columns?.filter(c => c.primaryKey).map(c => c.id) ?? [], [columns])
  const { toggleOrder } = useColumnsOrder()
  const renameColumnRef = useRef<{ rename: (schema: string, table: string, column: string) => void }>(null)

  useEffect(() => {
    if (!rows || !store.state.selected)
      return

    const validSelected = store.state.selected.filter(selectedRow =>
      rows.some(row => primaryColumns.every(key => row[key] === selectedRow[key])),
    )

    store.setState(state => ({
      ...state,
      selected: validSelected,
    } satisfies typeof state))
  }, [store, rows, primaryColumns])

  const setValue = useCallback((rowIndex: number, columnName: string, value: unknown) => {
    const rowsQueryOpts = connectionRowsQuery({
      connection,
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
  }, [connection, table, schema, store])

  const saveValue = useCallback(async (rowIndex: number, columnId: string, newValue: unknown) => {
    const rowsQueryOpts = connectionRowsQuery({
      connection,
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
    const initialValue = rows[rowIndex]![columnId]

    const preparedValue = prepareValue(newValue, columns?.find(c => c.id === columnId))

    setValue(rowIndex, columnId, preparedValue)

    const sqlFilters = primaryColumns.map(column => ({
      column,
      ref: SQL_FILTERS_LIST.find(f => f.operator === '=')!,
      values: [rows[rowIndex]![column]],
    }))

    const setValues = { [columnId]: preparedValue }

    try {
      await setQuery(connection, {
        schema,
        table,
        values: setValues,
        filters: sqlFilters,
      })

      if (filters.length > 0 || Object.keys(orderBy).length > 0)
        queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })
    }
    catch (e) {
      setValue(rowIndex, columnId, initialValue)
      throw e
    }

    const modifiedColumns = Object.keys(setValues)
    const updatedFilters = sqlFilters.map(filter => filter.column in modifiedColumns
      ? {
          ...filter,
          values: [setValues[filter.column]],
        }
      : filter)

    try {
      const [result] = await selectQuery(connection, {
        schema,
        table,
        select: modifiedColumns,
        filters: updatedFilters,
      })

      if (!result || !(columnId in result))
        return

      const realValue = result[columnId]

      if (newValue !== realValue)
        setValue(rowIndex, columnId, realValue ?? undefined)
    }
    catch (e) {
      toast.error('New value was saved, but the updated value was not refreshed', {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }, [connection, table, schema, store, primaryColumns, setValue, columns, filters, orderBy])

  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .filter(column => !hiddenColumns.includes(column.id))
      .toSorted((a, b) => a.primaryKey ? -1 : b.primaryKey ? 1 : 0)
      .map(column => ({
        id: column.id,
        size: getColumnSize(column.type)
          // 25 it's a ~size of the button, 6 it's a ~size of the number
          + (column.references?.length ? 25 + 6 : 0)
          + (column.foreign ? 25 : 0),
        header: (props) => {
          let onRename: (() => void) | undefined

          if (
            !column.primaryKey
            && connection.type !== ConnectionType.ClickHouse
          ) {
            onRename = () => renameColumnRef.current?.rename(schema, table, column.id)
          }

          return (
            <TableHeaderCell
              column={column}
              onSort={() => toggleOrder(column.id)}
              onRename={onRename}
              onResize={(newWidth) => {
                store.setState(state => ({
                  ...state,
                  columnSizes: {
                    ...state.columnSizes,
                    [column.id]: newWidth,
                  },
                } satisfies typeof state))
              }}
              {...props}
            />
          )
        },
        cell: (props) => {
          const values = enums ? findEnum(enums, column, table)?.values : undefined

          return (
            <TableCell
              column={column}
              onSaveValue={primaryColumns.length > 0 ? saveValue : undefined}
              values={values}
              {...props}
            />
          )
        },
      }) satisfies ColumnRenderer)

    if (primaryColumns.length > 0 && hiddenColumns.length !== columns.length) {
      sortedColumns.unshift({
        id: INTERNAL_COLUMN_IDS.SELECT,
        cell: props => <SelectionCell keys={primaryColumns} {...props} />,
        header: props => <SelectionHeaderCell keys={primaryColumns} {...props} />,
        size: 40,
      } satisfies ColumnRenderer)
    }

    sortedColumns.push({
      id: INTERNAL_COLUMN_IDS.ACTIONS,
      size: 100,
      cell: () => <div />,
      header: () => <div />,
    })

    return sortedColumns
  }, [connection, table, schema, columns, hiddenColumns, primaryColumns, saveValue, toggleOrder, enums, store])

  const handleShiftSelectionKeyDown = useShiftSelectionKeyDown({
    rowCount: rows.length,
    getRowKey: index => primaryColumns.reduce<Record<string, string>>(
      (acc, key) => ({ ...acc, [key]: rows[index]![key] as string }),
      {},
    ),
    getRangeKeys: (start, end) => {
      const rangeRows = rows.slice(start, end + 1)
      return rangeRows.map(row =>
        primaryColumns.reduce<Record<string, string>>(
          (acc, key) => ({ ...acc, [key]: row[key] as string }),
          {},
        ),
      )
    },
    getSelectionState: () => store.state.selectionState,
    onSelectionChange: (selected, selectionState) => {
      store.setState(state => ({
        ...state,
        selected,
        selectionState,
      } satisfies typeof state))
    },
  })

  const handleRowClick = useCallback((rowIndex: number) => {
    store.setState(state => ({
      ...state,
      detailRowIndex: state.detailRowIndex === rowIndex ? null : rowIndex,
    } satisfies typeof state))
  }, [store])

  return (
    <TableProvider
      rows={rows}
      columns={tableColumns}
      customColumnSizes={columnSizes}
      onRowClick={handleRowClick}
    >
      <div className="flex size-full">
        <div
          role="grid"
          className="relative min-w-0 flex-1 bg-background outline-none"
          tabIndex={0}
          onKeyDown={handleShiftSelectionKeyDown}
        >
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
                            connection={connection}
                            filters={filters}
                            orderBy={orderBy}
                          />
                        </>
                      )}
          </Table>
        </div>

        {detailRowIndex !== null && rows[detailRowIndex] && columns && (
          <RowDetailSidebar
            row={rows[detailRowIndex]}
            columns={columns}
            onClose={() =>
              store.setState(state => ({
                ...state,
                detailRowIndex: null,
              } satisfies typeof state))}
          />
        )}
      </div>
      <RenameColumnDialog ref={renameColumnRef} connection={connection} />
    </TableProvider>
  )
}

export {
  TableComponent as Table,
}
