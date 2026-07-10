import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ActiveFilter } from '@conar/shared/filters'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import type { ColumnRenderer, TableCellProps, TableHeaderCellProps } from '@conar/table'
import { Table, TableBody, TableHeader, TableProvider } from '@conar/table'
import { DEFAULT_COLUMN_WIDTH } from '@conar/table/constants'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { RiCornerRightUpLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'

import type { Column } from '~/entities/connection/components/table/cell'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { TableBodySkeleton, TableEmpty, TableError, TableHeaderCell, TableInfiniteLoader, useTableColumnsQuery } from '~/entities/connection/table'
import { createTransformer } from '~/entities/connection/transformers'

import { TableCellContent } from './cell-content'
import { getColumnSize } from './utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

function createCellRenderer(column: Column, connectionType: ConnectionType) {
  return function CellRenderer(props: TableCellProps) {
    const transformer = createTransformer(connectionType, column)
    return (
      <TableCellContent column={column} value={props.value} position={props.position} style={props.style}>
        <span className="truncate">{transformer.toDisplay(props.value, props.size)}</span>
      </TableCellContent>
    )
  }
}

function createHeaderRenderer(column: Column) {
  return function HeaderRenderer(props: TableHeaderCellProps) {
    return <TableHeaderCell column={column} {...props} />
  }
}

export function TableCellTable({ schema, table, column, value }: { schema: string; table: string; column: string; value: unknown }) {
  const { connection, connectionResource } = useRouteContext()
  const filters = [
    {
      column,
      ref: SQL_FILTERS_LIST.find((filter) => filter.operator === '=')!,
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
    (column) =>
      ({
        id: column.id,
        size: column.type ? getColumnSize(column.type) : DEFAULT_COLUMN_WIDTH,
        cell: createCellRenderer(column, connection.type),
        header: createHeaderRenderer(column),
      }) satisfies ColumnRenderer,
  )

  return (
    <TableProvider rows={rows} columns={columns}>
      <div className="relative size-full">
        <div className={`flex h-8 items-center justify-between bg-background px-4 text-xs text-muted-foreground`}>
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
            render={<Link to="/connection/$resourceId/table" params={{ resourceId: connectionResource.id }} search={{ schema, table, filters, orderBy }} />}
          >
            <RiCornerRightUpLine className="size-3" />
            Open table
          </Button>
        </div>
        <Table className={`h-[calc(100%-(--spacing(8)))] rounded-b-lg bg-background`}>
          <TableHeader />
          {isRowsPending ? (
            <TableBodySkeleton />
          ) : error ? (
            <TableError error={error} />
          ) : rows.length === 0 ? (
            <TableEmpty className="bottom-0 h-[calc(100%-5rem)]" title="Table is empty" description="There are no records to show" />
          ) : columns.length === 0 ? (
            <TableEmpty className="h-[calc(100%-5rem)]" title="No columns to show" description="Please show at least one column" />
          ) : (
            <>
              <TableBody data-mask className="bg-background" />
              <TableInfiniteLoader table={table} schema={schema} filters={filters} orderBy={orderBy} />
            </>
          )}
        </Table>
      </div>
    </TableProvider>
  )
}
