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
import { getDisplayValue } from '~/entities/connection/components/table/utils'
import { connectionRowsQuery } from '~/entities/connection/queries'
import { TableError } from '~/routes/_protected/database/$id/table/-components/table/table'
import { TableEmpty } from '~/routes/_protected/database/$id/table/-components/table/table-empty'
import { TableHeaderCell } from '~/routes/_protected/database/$id/table/-components/table/table-header-cell'
import { TableInfiniteLoader } from '~/routes/_protected/database/$id/table/-components/table/table-infinite-loader'
import { TableBodySkeleton } from '~/routes/_protected/database/$id/table/-components/table/table-skeleton'
import { getColumnSize } from '~/routes/_protected/database/$id/table/-lib'
import { useTableColumns } from '~/routes/_protected/database/$id/table/-queries/use-columns-query'
import { TableCellContent } from './table-cell-content'

const { useLoaderData } = getRouteApi('/_protected/database/$id')

export function TableCellTable({ schema, table, column, value }: { schema: string, table: string, column: string, value: unknown }) {
  const { connection } = useLoaderData()
  const filters = [{
    column,
    ref: SQL_FILTERS_LIST.find(filter => filter.operator === '=')!,
    values: [value],
  } satisfies ActiveFilter]
  const orderBy = {}
  const { data: rows, isPending: isRowsPending, error } = useInfiniteQuery(connectionRowsQuery({
    connection,
    table,
    schema,
    query: {
      filters,
      orderBy,
    },
  }))
  const columns = useTableColumns({ connection, table, schema })
  const tableColumns = useMemo(() => {
    if (!columns)
      return []

    const sortedColumns: ColumnRenderer[] = columns
      .toSorted((a, b) => a.primaryKey ? -1 : b.primaryKey ? 1 : 0)
      .map(column => ({
        id: column.id,
        size: getColumnSize(column.type),
        cell: props => (
          <TableCellContent
            value={props.value}
            position={props.position}
            style={props.style}
          >
            <span className="truncate">
              {getDisplayValue({
                value: props.value,
                size: props.size,
                column,
              })}
            </span>
          </TableCellContent>
        ),
        header: props => (
          <TableHeaderCell
            column={column}
            resize={false}
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
    >
      <div className="relative size-full">
        <div className={`
          flex h-8 items-center justify-between bg-background px-4 text-xs
          text-muted-foreground
        `}
        >
          <div>
            Showing records from
            {' '}
            <Badge data-mask variant="secondary">
              {schema === 'public' ? '' : `${schema}.`}
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
              params={{ id: connection.id }}
              search={{ schema, table, filters, orderBy }}
            >
              <RiCornerRightUpLine className="size-3" />
              Open table
            </Link>
          </Button>
        </div>
        <Table className={`
          h-[calc(100%-(--spacing(8)))] rounded-b-lg bg-background
        `}
        >
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
                          connection={connection}
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
