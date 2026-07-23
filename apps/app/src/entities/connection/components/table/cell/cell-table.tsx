import { RiCornerRightUpLine } from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import type { ColumnRenderer } from '@tamery/table'
import { Table, TableBody, TableHeader, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { Link } from '~/components/link'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { createTransformer } from '~/entities/connection/transformers'
import { TableError } from '~/routes/_protected/connection/$resourceId/table/-components/table/table'
import { TableEmpty } from '~/routes/_protected/connection/$resourceId/table/-components/table/table-empty'
import { TableHeaderCell } from '~/routes/_protected/connection/$resourceId/table/-components/table/table-header-cell'
import { TableInfiniteLoader } from '~/routes/_protected/connection/$resourceId/table/-components/table/table-infinite-loader'
import { TableBodySkeleton } from '~/routes/_protected/connection/$resourceId/table/-components/table/table-skeleton'
import { useTableColumnsQuery } from '~/routes/_protected/connection/$resourceId/table/-lib/columns'

import { TableCellContent } from './cell-content'
import { getColumnSize } from './utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export function TableCellTable({
  schema,
  table,
  column,
  value,
}: {
  schema: string
  table: string
  column: string
  value: unknown
}) {
  const { connection, connectionResource } = useRouteContext()
  const filters = [
    {
      column,
      ref: SQL_FILTERS_LIST.find(filter => filter.operator === '=')!,
      values: [value],
    } satisfies ActiveFilter,
  ]
  const orderBy = {}
  const {
    data: rows = [],
    isPending: isRowsPending,
    error,
  } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: {
        filters,
        orderBy,
      },
    }),
  )
  const { data = [] } = useTableColumnsQuery({ connectionResource, table, schema })
  const columns = data.map(
    column =>
      ({
        id: column.id,
        size: column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH,
        cell: props => {
          const transformer = createTransformer(connection.type, column)
          return (
            <TableCellContent
              column={column}
              value={props.value}
              position={props.position}
              style={props.style}
            >
              <span className="truncate">{transformer.toDisplay(props.value, props.size)}</span>
            </TableCellContent>
          )
        },
        header: props => <TableHeaderCell column={column} {...props} />,
      }) satisfies ColumnRenderer,
  )

  return (
    <TableProvider rows={rows} columns={columns}>
      <div className="relative size-full">
        <div
          className={`
          flex h-8 items-center justify-between bg-background px-4 text-xs
          text-muted-foreground
        `}
        >
          <div>
            Showing records from{' '}
            <Badge data-mask variant="secondary">
              {schema === 'public' ? '' : `${schema}.`}
              {table}
            </Badge>{' '}
            where{' '}
            <Badge data-mask variant="secondary">
              {column}
            </Badge>{' '}
            ={' '}
            <Badge data-mask variant="secondary">
              {String(value)}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="xs"
            nativeButton={false}
            render={
              <Link
                to="/connection/$resourceId/table"
                params={{ resourceId: connectionResource.id }}
                search={{ schema, table, filters, orderBy }}
              />
            }
          >
            <RiCornerRightUpLine className="size-3" />
            Open table
          </Button>
        </div>
        <Table className="h-[calc(100%-(--spacing(8)))] rounded-b-lg bg-background">
          <TableHeader />
          {isRowsPending ? (
            <TableBodySkeleton />
          ) : error ? (
            <TableError error={error} />
          ) : rows.length === 0 ? (
            <TableEmpty
              className="bottom-0 h-[calc(100%-5rem)]"
              title="Table is empty"
              description="There are no records to show"
            />
          ) : columns.length === 0 ? (
            <TableEmpty
              className="h-[calc(100%-5rem)]"
              title="No columns to show"
              description="Please show at least one column"
            />
          ) : (
            <>
              <TableBody data-mask className="bg-background" />
              <TableInfiniteLoader
                table={table}
                schema={schema}
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
