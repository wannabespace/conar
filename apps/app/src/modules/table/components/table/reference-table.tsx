import { CornerRightUpIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { EQUAL_FILTER } from '@tamery/shared/filters'
import type { ColumnRenderer } from '@tamery/table'
import { Table, TableBody, TableHeader, TableProvider } from '@tamery/table'
import { DEFAULT_COLUMN_WIDTH } from '@tamery/table/constants'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { Link } from '~/components/link'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { TableCellContent } from '~/core/table/cell/cell-content'
import { getColumnSize } from '~/core/table/cell/utils'
import { TableError } from '~/core/table/table-error'
import { tableTabId } from '~/core/tabs/ids'
import { createTransformer } from '~/core/transformers/create-transformer'

import { useTableColumnsQuery } from '../../lib/columns'
import { TableEmpty } from './table-empty'
import { TableHeaderCell } from './table-header-cell'
import { TableInfiniteLoader } from './table-infinite-loader'
import { TableBodySkeleton } from './table-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

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

export const ReferenceTable = ({
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
      ref: EQUAL_FILTER,
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
