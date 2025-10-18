import type { ActiveFilter } from '@conar/shared/filters'
import type { ColumnRenderer } from '~/components/table'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { RiCornerRightUpLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Table, TableBody, TableHeader, TableProvider } from '~/components/table'
import { TableError } from '~/routes/(protected)/_protected/database/$id/table/-components/table'
import { TableEmpty } from '~/routes/(protected)/_protected/database/$id/table/-components/table-empty'
import { TableHeaderCell } from '~/routes/(protected)/_protected/database/$id/table/-components/table-header-cell'
import { TableInfiniteLoader } from '~/routes/(protected)/_protected/database/$id/table/-components/table-infinite-loader'
import { TableBodySkeleton } from '~/routes/(protected)/_protected/database/$id/table/-components/table-skeleton'
import { columnsSizeMap } from '~/routes/(protected)/_protected/database/$id/table/-lib'
import { useTableColumns } from '~/routes/(protected)/_protected/database/$id/table/-queries/use-columns-query'
import { DEFAULT_ROW_HEIGHT } from '..'
import { getDisplayValue } from '../lib/render'
import { databaseRowsQuery } from '../queries/rows'
import { DEFAULT_COLUMN_WIDTH } from '../utils/helpers'
import { TableCellContent } from './table-cell-content'

const { useLoaderData } = getRouteApi('/(protected)/_protected/database/$id')

export function TableCellTable({ schema, table, column, value }: { schema: string, table: string, column: string, value: unknown }) {
  const { database } = useLoaderData()
  const filters = [{
    column,
    ref: SQL_FILTERS_LIST.find(filter => filter.operator === '=')!,
    values: [value],
  } satisfies ActiveFilter]
  const orderBy = {}
  const { data: rows, isPending: isRowsPending, error } = useInfiniteQuery(databaseRowsQuery({
    database,
    table,
    schema,
    query: {
      filters,
      orderBy,
    },
  }))
  const columns = useTableColumns({ database, table, schema })
  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .toSorted((a, b) => a.primaryKey ? -1 : b.primaryKey ? 1 : 0)
      .map(column => ({
        id: column.id,
        size: columnsSizeMap.get(column.type) ?? DEFAULT_COLUMN_WIDTH,
        cell: ({ columnIndex, rowIndex, ...props }) => (
          <TableCellContent {...props}>
            <span className="truncate">
              {getDisplayValue(props.value, props.size)}
            </span>
          </TableCellContent>
        ),
        header: ({ className, ...props }) => (
          <TableHeaderCell
            column={column}
            {...props}
          />
        ),
      }) satisfies ColumnRenderer)

    return sortedColumns
  }, [columns])

  return (
    <TableProvider
      rows={rows ?? []}
      columns={tableColumns}
      estimatedRowSize={DEFAULT_ROW_HEIGHT}
      estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
    >
      <div className="size-full relative">
        <div className="px-4 flex items-center justify-between h-8 text-xs text-muted-foreground bg-background">
          <div>
            Showing records from
            {' '}
            <Badge data-mask variant="secondary">
              {schema}
              .
              {table}
            </Badge>
            {' '}
            where
            {' '}
            <Badge data-mask variant="secondary">{column}</Badge>
            {' '}
            =
            {' '}
            <Badge data-mask variant="secondary">{String(value)}</Badge>
          </div>
          <Button
            variant="outline"
            size="xs"
            asChild
          >
            <Link
              to="/database/$id/table"
              params={{ id: database.id }}
              search={{ schema, table, filters, orderBy }}
            >
              <RiCornerRightUpLine className="size-3" />
              Open table
            </Link>
          </Button>
        </div>
        <Table className="bg-background h-[calc(100%-theme(spacing.8))] rounded-b-lg">
          <TableHeader />
          {isRowsPending
            ? <TableBodySkeleton />
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
