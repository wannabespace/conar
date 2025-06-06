import type { ColumnRenderer } from '~/components/table'
import { useInViewport } from '@conar/ui/hookas/use-in-viewport'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { cn } from '@conar/ui/lib/utils'
import { RiErrorWarningLine, RiLoaderLine, RiMoreLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useRef } from 'react'
import { Table, TableBody, TableHeader, TableProvider, useTableContext } from '~/components/table'
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, setSql, useDatabase } from '~/entities/database'
import { createCellUpdater } from '~/entities/database/components/cells-updater'
import { TableCell } from '~/entities/database/components/table-cell'
import { queryClient } from '~/main'
import { Route, usePageContext } from '..'
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

export function TableEmpty({ className, title, description }: { className?: string, title: string, description: string }) {
  return (
    <div className={cn('sticky left-0 pointer-events-none h-[clamp(40vh,70vh,100%)] flex items-center justify-center', className)}>
      <div className="flex flex-col items-center justify-center w-full h-32">
        <div className="flex items-center justify-center rounded-full bg-muted/60 p-3 mb-4">
          <RiMoreLine className="size-6 text-muted-foreground" />
        </div>
        <span className="text-muted-foreground font-medium">{title}</span>
        <span className="text-xs text-muted-foreground/70">{description}</span>
      </div>
    </div>
  )
}

function TableInfiniteLoader() {
  const rowsQueryOpts = useRowsQueryOpts()
  const { fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(rowsQueryOpts)
  const loaderRef = useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(loaderRef)
  const { store } = usePageContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [isVisible])

  const scrollRef = useTableContext(state => state.scrollRef)
  useMountedEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, orderBy])

  return (
    <div className="sticky left-0 h-[calc(100%-2rem)] pointer-events-none">
      <div ref={loaderRef} className="absolute h-[calc(50vh+50rem)] bottom-0 inset-x-0" />
      <div className="flex items-center justify-center h-[inherit]">
        {hasNextPage
          ? <RiLoaderLine className="size-10 animate-spin opacity-50" />
          : <TableEmpty className="bottom-0" title="No more data" description="This table has no more rows" />}
      </div>
    </div>
  )
}

function TableComponent() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { data: columns, isPending: isColumnsPending } = useColumnsQuery(database, table, schema)
  const { store } = usePageContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const rowsQueryOpts = useRowsQueryOpts()
  const { data: rows, error, isPending: isRowsPending } = useInfiniteQuery(rowsQueryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const selectable = useMemo(() => !!primaryKeys && primaryKeys.length > 0, [primaryKeys])

  const setValue = (rowIndex: number, columnName: string, value: unknown) => {
    queryClient.setQueryData(rowsQueryOpts.queryKey, (oldData) => {
      if (!oldData)
        return oldData

      const newRows = [...oldData.pages.flatMap(page => page.rows)]

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
      values: [value, ...primaryKeys.map(key => data.pages.flatMap(page => page.rows)[rowIndex][key])],
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
      .filter(column => !hiddenColumns.includes(column.name))
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

    if (selectable && hiddenColumns.length !== columns.length) {
      sortedColumns.unshift({
        id: String(selectSymbol),
        cell: SelectionCell,
        header: SelectionHeaderCell,
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
          {isColumnsPending ? <TableHeaderSkeleton selectable={selectable} /> : tableColumns.length > 0 ? <TableHeader /> : null}
          {isRowsPending || isColumnsPending
            ? <TableBodySkeleton selectable={selectable} />
            : error
              ? <TableError error={error} />
              : rows?.length === 0
                ? <TableEmpty className="bottom-0" title="Table is empty" description="There are no records to show" />
                : tableColumns.length === 0
                  ? <TableEmpty title="No columns to show" description="Please show at least one column" />
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
