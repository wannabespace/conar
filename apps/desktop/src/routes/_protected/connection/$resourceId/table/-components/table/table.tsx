import type { ColumnRenderer } from '@conar/table'
import type { ComponentRef } from 'react'
import type { Column } from '~/entities/connection/components/table/cell'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { Table, TableBody, TableProvider } from '@conar/table'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'
import { useShiftSelectionKeyDown } from '@conar/table/hooks'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { TableCell } from '~/entities/connection/components'
import { getColumnSize, INTERNAL_COLUMN_IDS } from '~/entities/connection/components/table/cell'
import { findEnum, resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums'
import { selectQuery } from '~/entities/connection/queries/select'
import { setQuery } from '~/entities/connection/queries/set'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { queryClient } from '~/main'
import { Route } from '../..'
import { useTableColumns } from '../../-queries/use-table-columns'
import { useTablePageSelectionStore, useTablePageStore } from '../../-store'
import { useColumnsOrder } from '../use-columns-order'
import { RenameColumnDialog } from './rename-column-dialog'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'

function prepareValue(value: unknown, column: Column): unknown {
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
  const { connection, connectionResource } = Route.useRouteContext()
  const { data: enums } = useQuery(resourceEnumsQueryOptions({ connectionResource }))
  const columns = useTableColumns({ connectionResource, table, schema })
  const store = useTablePageStore()
  const selectionStore = useTablePageSelectionStore()
  const hiddenColumns = useSubscription(store, { selector: state => state.hiddenColumns })
  const columnSizes = useSubscription(store, { selector: state => state.columnSizes })
  const filters = useSubscription(store, { selector: state => state.filters })
  const orderBy = useSubscription(store, { selector: state => state.orderBy })
  const { data: rows = [], error, isPending: isRowsPending } = useInfiniteQuery(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }))
  const primaryColumns = useMemo(() => columns?.filter(c => c.primaryKey).map(c => c.id) ?? [], [columns])
  const { toggleOrder, setOrder, removeOrder } = useColumnsOrder()
  const renameColumnRef = useRef<ComponentRef<typeof RenameColumnDialog>>(null)

  useEffect(() => {
    if (!rows || !store.get().selected)
      return

    const validSelected = store.get().selected.filter(selectedRow =>
      rows.some(row => primaryColumns.every(key => row[key] === selectedRow[key])),
    )

    store.set(state => ({
      ...state,
      selected: validSelected,
    } satisfies typeof state))
  }, [store, rows, primaryColumns])

  const setValue = useCallback((rowIndex: number, columnName: string, value: unknown) => {
    const { filters, orderBy } = store.get()
    const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: {
        filters,
        orderBy,
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
  }, [connectionResource, table, schema, store])

  const saveValue = useCallback(async (rowIndex: number, columnId: string, newValue: unknown) => {
    const { filters, orderBy } = store.get()
    const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: {
        filters,
        orderBy,
      },
    })

    const data = queryClient.getQueryData(rowsQueryOpts.queryKey)

    if (!data)
      throw new Error('No data found. Please refresh the page.')

    if (primaryColumns.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    const rows = data.pages.flatMap(page => page.rows)
    const initialValue = rows[rowIndex]![columnId]

    const foundColumn = columns.find(c => c.id === columnId)
    const preparedValue = foundColumn ? prepareValue(newValue, foundColumn) : newValue

    setValue(rowIndex, columnId, preparedValue)

    const sqlFilters = primaryColumns.map(column => ({
      column,
      ref: SQL_FILTERS_LIST.find(f => f.operator === '=')!,
      values: [rows[rowIndex]![column]],
    }))

    const setValues = { [columnId]: preparedValue }

    try {
      await setQuery({
        schema,
        table,
        values: setValues,
        filters: sqlFilters,
      }).run(connectionResourceToQueryParams(connectionResource))

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
      const [result] = await selectQuery({
        schema,
        table,
        select: modifiedColumns.map(column => column),
        filters: updatedFilters,
      }).run(connectionResourceToQueryParams(connectionResource))

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
  }, [connectionResource, table, schema, store, primaryColumns, setValue, columns])

  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .filter(c => !hiddenColumns.includes(c.id))
      .toSorted((a, b) => (a.primaryKey ? -1 : b.primaryKey ? 1 : 0))
      .map(column => ({
        id: column.id,
        size: (column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH)
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
                store.set(state => ({
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
          const availableValues = enums ? findEnum(enums, column, table)?.values : undefined

          return (
            <TableCell
              column={column}
              onSaveValue={primaryColumns.length > 0 ? saveValue : undefined}
              availableValues={availableValues}
              onAddFilter={filter => store.set(state => ({
                ...state,
                filters: [...state.filters, filter],
              } satisfies typeof state))}
              onSort={(columnId, order) => order ? setOrder(columnId, order) : removeOrder(columnId)}
              sortOrder={orderBy[column.id] ?? null}
              onRenameColumn={!column.primaryKey && connection.type !== ConnectionType.ClickHouse
                ? () => renameColumnRef.current?.rename(schema, table, column.id)
                : undefined}
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
  }, [connection, table, schema, columns, hiddenColumns, primaryColumns, saveValue, toggleOrder, setOrder, removeOrder, enums, store, orderBy])

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
    getSelectionState: () => selectionStore.get().selectionState,
    onSelectionChange: (selected, selectionState) => {
      store.set(state => ({ ...state, selected } satisfies typeof state))
      selectionStore.set(state => ({ ...state, selectionState } satisfies typeof state))
    },
  })

  return (
    <TableProvider
      rows={rows}
      columns={tableColumns}
      customColumnSizes={columnSizes}
    >
      <div
        role="grid"
        className="relative size-full bg-background outline-none"
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
                          connectionResource={connectionResource}
                          table={table}
                          schema={schema}
                          filters={filters}
                          orderBy={orderBy}
                        />
                      </>
                    )}
        </Table>
      </div>
      <RenameColumnDialog ref={renameColumnRef} />
    </TableProvider>
  )
}

export {
  TableComponent as Table,
}
