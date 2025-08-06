import type { ColumnRenderer } from '~/components/table'
import { setSql } from '@conar/shared'
import { RiErrorWarningLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { Table, TableBody, TableProvider } from '~/components/table'
  import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from '~/entities/database'
import { TableCell } from '~/entities/database/components/table-cell'
import { dbQuery } from '~/lib/db-query'
import { queryClient } from '~/lib/react-query'
import { Route, usePageContext } from '..'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { TableEmpty } from './table-empty'
import { TableHeader } from './table-header'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { SelectionCell, SelectionHeaderCell } from './table-selection'
import { TableBodySkeleton } from './table-skeleton'
import { columnsSizeMap, DEFAULT_COLUMN_WIDTH, selectSymbol } from '../-lib/constants'
import { findRowIndexByPrimaryKey } from '../-lib/primary-keys'

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

function TableComponent() {
  const { table, schema } = Route.useParams()
  const { database } = Route.useLoaderData()
  const columns = useTableColumns(database, table, schema)
  const { store } = usePageContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const rowsQueryOpts = useRowsQueryOpts()
  const { data: rows, error, isPending: isRowsPending } = useInfiniteQuery(rowsQueryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const selectable = useMemo(() => !!primaryKeys && primaryKeys.length > 0, [primaryKeys])

  const setValue = (primaryKey: Record<string, unknown>, columnName: string, value: unknown) => {
    if (!primaryKeys) return
    
    queryClient.setQueryData(rowsQueryOpts.queryKey, data => {
      if (!data) return data
      
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          rows: page.rows.map((row) => {
            // Check if this row matches the primary key
            const rowMatches = primaryKeys.every(key => row[key] === primaryKey[key])
            return rowMatches
              ? { ...row, [columnName]: value }
              : row
          }),
        })),
      }
    })
  }

  const saveValue = async (primaryKey: Record<string, unknown>, columnName: string, value: unknown) => {
    const data = queryClient.getQueryData(rowsQueryOpts.queryKey)

    if (!data)
      throw new Error('No data found. Please refresh the page.')

    if (!primaryKeys || primaryKeys.length === 0)
      throw new Error('No primary keys found. Please use SQL Runner to update this row.')

    await dbQuery({
      type: database.type,
      connectionString: database.connectionString,
      query: setSql(schema, table, columnName, primaryKeys)[database.type],
      values: [value, ...primaryKeys.map(key => primaryKey[key])],
    })

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
            onSetValue={(rowIndex, columnName, value) => {
              // Convert rowIndex to primary key
              const flatRows = rows ? rows.flatMap(page => page.rows) : []
              const row = flatRows[rowIndex]
              if (row && primaryKeys) {
                const rowPrimaryKey = primaryKeys.reduce((acc, key) => {
                  acc[key] = row[key]
                  return acc
                }, {} as Record<string, unknown>)
                setValue(rowPrimaryKey, columnName, value)
              }
            }}
            onSaveValue={async (rowIndex, columnName, value) => {
              // Convert rowIndex to primary key
              const flatRows = rows ? rows.flatMap(page => page.rows) : []
              const row = flatRows[rowIndex]
              if (row && primaryKeys) {
                const rowPrimaryKey = primaryKeys.reduce((acc, key) => {
                  acc[key] = row[key]
                  return acc
                }, {} as Record<string, unknown>)
                await saveValue(rowPrimaryKey, columnName, value)
              }
            }}
            {...props}
          />
        ),
        header: props => <TableHeaderCell column={column} {...props} />,
      }) satisfies ColumnRenderer)

    if (selectable && hiddenColumns.length !== columns.length) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: SelectionCell,
        header: SelectionHeaderCell,
        size: 40,
      } satisfies ColumnRenderer)
    }

    return sortedColumns
  }, [columns, hiddenColumns, selectable, setValue, saveValue, rows, primaryKeys])

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
                        <TableInfiniteLoader />
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
