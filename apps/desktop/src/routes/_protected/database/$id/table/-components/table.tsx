import type { KeyboardEvent } from 'react'
import type { ColumnRenderer } from '~/components/table'
import type { Column } from '~/entities/database/utils'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableProvider } from '~/components/table'
import { TableCell } from '~/entities/database/components'
import { databaseRowsQuery } from '~/entities/database/queries'
import { useDatabaseEnums } from '~/entities/database/queries/enums'
import { selectQuery, setQuery } from '~/entities/database/sql'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database/utils'
import { queryClient } from '~/main'
import { Route } from '..'
import { getColumnSize, selectSymbol } from '../-lib'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext, useSelectionStateRef } from '../-store'
import { useHeaderActionsOrder } from './header-actions-order'
import { RenameColumnDialog } from './rename-column-dialog'
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
  const { database } = Route.useLoaderData()
  const { data: enums } = useDatabaseEnums({ database })
  const columns = useTableColumns({ database, table, schema })
  const store = usePageStoreContext()
  const selectionStateRef = useSelectionStateRef()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { data: rows, error, isPending: isRowsPending } = useInfiniteQuery(databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }))
  const primaryColumns = useMemo(() => columns?.filter(c => c.primaryKey).map(c => c.id) ?? [], [columns])
  const { onOrder } = useHeaderActionsOrder()
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

  const saveValue = useCallback(async (rowIndex: number, columnId: string, newValue: unknown) => {
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
      await setQuery(database, {
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
      const [result] = await selectQuery(database, {
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
  }, [database, table, schema, store, primaryColumns, setValue, columns, filters, orderBy])

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
            && database.type !== 'clickhouse'
          ) {
            onRename = () => renameColumnRef.current?.rename(schema, table, column.id)
          }

          return (
            <TableHeaderCell
              column={column}
              onSort={() => onOrder(column.id)}
              onRename={onRename}
              {...props}
            />
          )
        },
        cell: (props) => {
          const values = enums?.find(e => e.name === column.enum
            && (e.metadata?.column ? e.metadata.column === column.id : true)
            && (e.metadata?.table ? e.metadata.table === table : true),
          )?.values

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
        id: String(selectSymbol),
        cell: props => <SelectionCell keys={primaryColumns} {...props} />,
        header: props => <SelectionHeaderCell keys={primaryColumns} {...props} />,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [database, table, schema, columns, hiddenColumns, primaryColumns, saveValue, onOrder, enums])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.shiftKey || !rows || rows.length === 0 || primaryColumns.length === 0)
      return

    const isArrowDown = event.key === 'ArrowDown'
    const isArrowUp = event.key === 'ArrowUp'

    if (!isArrowDown && !isArrowUp)
      return

    event.preventDefault()

    const { anchorIndex, focusIndex } = selectionStateRef.current
    const currentDirection = isArrowDown ? 'down' : 'up'

    if (anchorIndex === null || focusIndex === null) {
      const startIndex = isArrowDown ? 0 : rows.length - 1
      selectionStateRef.current = { anchorIndex: startIndex, focusIndex: startIndex, lastExpandDirection: null }

      const rowKeys = primaryColumns.reduce<Record<string, string>>(
        (acc, key) => ({ ...acc, [key]: rows[startIndex]![key] as string }),
        {},
      )

      store.setState(state => ({
        ...state,
        selected: [rowKeys],
      } satisfies typeof state))
      return
    }

    const newFocusIndex = isArrowDown
      ? Math.min(focusIndex + 1, rows.length - 1)
      : Math.max(focusIndex - 1, 0)

    const atBoundary = newFocusIndex === focusIndex

    if (anchorIndex === focusIndex) {
      if (atBoundary)
        return

      selectionStateRef.current = { anchorIndex, focusIndex: newFocusIndex, lastExpandDirection: currentDirection }

      const start = Math.min(anchorIndex, newFocusIndex)
      const end = Math.max(anchorIndex, newFocusIndex)
      const rangeRows = rows.slice(start, end + 1)
      const rangeKeys = rangeRows.map(row =>
        primaryColumns.reduce<Record<string, string>>(
          (acc, key) => ({ ...acc, [key]: row[key] as string }),
          {},
        ),
      )

      store.setState(state => ({
        ...state,
        selected: rangeKeys,
      } satisfies typeof state))
      return
    }

    if (atBoundary)
      return

    const wasExpandedDown = focusIndex > anchorIndex
    const wasExpandedUp = focusIndex < anchorIndex
    const isShrinking = (wasExpandedDown && isArrowUp) || (wasExpandedUp && isArrowDown)

    selectionStateRef.current.focusIndex = newFocusIndex
    if (!isShrinking) {
      selectionStateRef.current.lastExpandDirection = currentDirection
    }

    const start = Math.min(anchorIndex, newFocusIndex)
    const end = Math.max(anchorIndex, newFocusIndex)

    const rangeRows = rows.slice(start, end + 1)
    const rangeKeys = rangeRows.map(row =>
      primaryColumns.reduce<Record<string, string>>(
        (acc, key) => ({ ...acc, [key]: row[key] as string }),
        {},
      ),
    )

    store.setState(state => ({
      ...state,
      selected: rangeKeys,
    } satisfies typeof state))
  }, [rows, primaryColumns, store, selectionStateRef])

  return (
    <TableProvider
      rows={rows ?? []}
      columns={tableColumns}
      estimatedRowSize={DEFAULT_ROW_HEIGHT}
      estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
    >
      <div
        className="relative size-full bg-background outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
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
                          database={database}
                          filters={filters}
                          orderBy={orderBy}
                        />
                      </>
                    )}
        </Table>
      </div>
      <RenameColumnDialog ref={renameColumnRef} database={database} />
    </TableProvider>
  )
}

export {
  TableComponent as Table,
}
