import { CornerRightUpIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
import { tableTabId } from '~/entities/connection/store'
import { createTransformer } from '~/entities/connection/transformers'
import { TableError } from '~/routes/_protected/connection/$resourceId/-tabs/table/-components/table/table'
import { TableEmpty } from '~/routes/_protected/connection/$resourceId/-tabs/table/-components/table/table-empty'
import { TableHeaderCell } from '~/routes/_protected/connection/$resourceId/-tabs/table/-components/table/table-header-cell'
import { TableInfiniteLoader } from '~/routes/_protected/connection/$resourceId/-tabs/table/-components/table/table-infinite-loader'
import { TableBodySkeleton } from '~/routes/_protected/connection/$resourceId/-tabs/table/-components/table/table-skeleton'
import { useTableColumnsQuery } from '~/routes/_protected/connection/$resourceId/-tabs/table/-lib/columns'

import { TableCellContent } from './cell-content'
import { getColumnSize } from './utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const equalsFilter = SQL_FILTERS_LIST.find((filter) => filter.operator === '=')
if (!equalsFilter) {
  throw new Error('Equals filter definition is missing')
}

const renderForeignTableBody = ({
  isRowsPending,
  error,
  rowsLength,
  columnsLength,
  table,
  schema,
  filters,
  orderBy,
}: {
  isRowsPending: boolean
  error: Error | null
  rowsLength: number
  columnsLength: number
  table: string
  schema: string
  filters: ActiveFilter[]
  orderBy: Record<string, never>
}) => {
  if (isRowsPending) {
    return <TableBodySkeleton />
  }
  if (error) {
    return <TableError error={error} />
  }
  if (rowsLength === 0) {
    return (
      <TableEmpty
        className="bottom-0 h-[calc(100%-5rem)]"
        title="Table is empty"
        description="There are no records to show"
      />
    )
  }
  if (columnsLength === 0) {
    return (
      <TableEmpty
        className="h-[calc(100%-5rem)]"
        title="No columns to show"
        description="Please show at least one column"
      />
    )
  }
  return (
    <>
      <TableBody data-mask className="bg-background" />
      <TableInfiniteLoader
        table={table}
        schema={schema}
        filters={filters}
        orderBy={orderBy}
      />
    </>
  )
}

export const TableCellTable = ({
  schema,
  table,
  column,
  value,
}: {
  schema: string
  table: string
  column: string
  value: unknown
}) => {
  const { connection, connectionResource } = useRouteContext()
  const filters = [
    {
      column,
      ref: equalsFilter,
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
      query: {
        filters,
        orderBy,
      },
      schema,
      table,
    })
  )
  const { data = [] } = useTableColumnsQuery({
    connectionResource,
    schema,
    table,
  })
  const columns = data.map(
    (columnMeta) =>
      ({
        // oxlint-disable-next-line react/no-unstable-nested-components
        cell: (props) => {
          const transformer = createTransformer(connection.type, columnMeta)
          return (
            <TableCellContent
              column={columnMeta}
              value={props.value}
              position={props.position}
              style={props.style}
            >
              <span className="truncate">
                {transformer.toDisplay(props.value, props.size)}
              </span>
            </TableCellContent>
          )
        },
        // oxlint-disable-next-line react/no-unstable-nested-components
        header: (props) => <TableHeaderCell column={columnMeta} {...props} />,
        id: columnMeta.id,
        size: columnMeta.type
          ? getColumnSize(columnMeta.type)
          : DEFAULT_COLUMN_WIDTH,
      }) satisfies ColumnRenderer
  )

  return (
    <TableProvider rows={rows} columns={columns}>
      <div className="relative size-full">
        <div className="bg-background text-muted-foreground flex h-8 items-center justify-between px-4 text-xs">
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
                to="/connection/$resourceId/$tabId"
                params={{
                  resourceId: connectionResource.id,
                  tabId: tableTabId(schema, table),
                }}
                search={{ filters, orderBy }}
              />
            }
          >
            <HugeiconsIcon
              icon={CornerRightUpIcon}
              strokeWidth={2}
              className="size-3"
            />
            Open table
          </Button>
        </div>
        <Table className="bg-background h-[calc(100%-(--spacing(8)))] rounded-b-lg">
          <TableHeader />
          {renderForeignTableBody({
            columnsLength: columns.length,
            error,
            filters,
            isRowsPending,
            orderBy,
            rowsLength: rows.length,
            schema,
            table,
          })}
        </Table>
      </div>
    </TableProvider>
  )
}
