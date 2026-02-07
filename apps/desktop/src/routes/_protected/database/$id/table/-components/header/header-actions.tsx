import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiExportLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { ExportData } from '~/components/export-data'
import { connectionConstraintsQuery, connectionRowsQuery, connectionTableColumnsQuery, connectionTableTotalQuery } from '~/entities/connection/queries'
import { rowsQuery } from '~/entities/connection/sql/rows'
import { rowToTypedJson } from '~/entities/connection/utils/row-json'
import { queryClient } from '~/main'
import { Route } from '../../'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsCopy } from './header-actions-copy'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'
import { HeaderActionsOrder } from './header-actions-order'

function encodePrimaryKeyValue(value: unknown) {
  if (value instanceof Date) {
    return ['date', value.toISOString()]
  }

  if (typeof value === 'bigint') {
    return ['bigint', value.toString()]
  }

  return [typeof value, value]
}

function makePrimaryKey(row: Record<string, unknown>, keys: string[]) {
  return JSON.stringify(keys.map(key => encodePrimaryKeyValue(row[key])))
}

export function HeaderActions({ table, schema }: { table: string, schema: string }) {
  const { connection } = Route.useLoaderData()
  const store = usePageStoreContext()
  const [filters, orderBy, exact, selected] = useStore(store, state => [state.filters, state.orderBy, state.exact, state.selected])
  const columns = useTableColumns({ connection, table, schema })
  const { isFetching, dataUpdatedAt, refetch, data: rows = [], isPending } = useInfiniteQuery(
    connectionRowsQuery({ connection, table, schema, query: { filters, orderBy } }),
  )

  const primaryColumns = useMemo(
    () => columns.filter(column => column.primaryKey).map(column => column.id),
    [columns],
  )

  const selectedRows = useMemo(() => {
    if (selected.length === 0 || primaryColumns.length === 0 || rows.length === 0)
      return []

    const selectedKeySet = new Set(
      selected.map(selectedRow => makePrimaryKey(selectedRow as Record<string, unknown>, primaryColumns)),
    )

    return rows.filter(row =>
      selectedKeySet.has(makePrimaryKey(row as Record<string, unknown>, primaryColumns)),
    )
  }, [rows, selected, primaryColumns])

  const canCopySelectedRowsAsTypedJson = columns.length > 0 && selected.length > 0 && selectedRows.length === selected.length

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(connectionTableColumnsQuery({ connection, table, schema }))
    queryClient.invalidateQueries(connectionTableTotalQuery({ connection, table, schema, query: { filters, exact } }))
    queryClient.invalidateQueries(connectionConstraintsQuery({ connection }))
  }

  const getAllData = async () => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const batch = await rowsQuery(connection, {
        schema,
        table,
        limit,
        offset,
        orderBy,
        filters,
      })

      data.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
    }

    return data
  }

  const getLimitedData = async (limit: number) => rowsQuery(connection, {
    schema,
    table,
    limit,
    offset: 0,
    orderBy,
    filters,
  })

  const getData = async (limit?: number) => {
    return limit ? getLimitedData(limit) : getAllData()
  }

  const copyJsonActions = useMemo(() => ([
    {
      id: 'selected-rows-typed-json',
      label: 'Selected rows',
      disabled: !canCopySelectedRowsAsTypedJson,
      getContent: async () => {
        if (!canCopySelectedRowsAsTypedJson) {
          return {
            content: '[]',
            message: selected.length === 0
              ? 'No selected rows to copy'
              : 'Selected rows are not loaded yet',
          }
        }

        const typedRows = selectedRows.map(row => rowToTypedJson(row, columns))

        return {
          content: JSON.stringify(typedRows, null, 2),
          message: `Copied ${selectedRows.length} ${selectedRows.length === 1 ? 'row' : 'rows'} as typed JSON`,
        }
      },
    },
  ]), [canCopySelectedRowsAsTypedJson, selected.length, selectedRows, columns])

  return (
    <div className="flex items-center gap-2">
      <HeaderActionsDelete
        table={table}
        schema={schema}
        connection={connection}
      />
      <HeaderActionsCopy
        connection={connection}
        table={table}
        schema={schema}
      />
      <HeaderActionsColumns
        connection={connection}
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder
        connection={connection}
        table={table}
        schema={schema}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <LoadingContent loading={isFetching}>
                <ContentSwitch
                  activeContent={<RiCheckLine className="text-success" />}
                  active={isFetching}
                >
                  <RiLoopLeftLine />
                </ContentSwitch>
              </LoadingContent>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="end">
            Refresh rows
            <p className="text-xs text-muted-foreground">
              Last updated:
              {' '}
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Separator orientation="vertical" className="h-6!" />
      <ExportData
        filename={`${schema}_${table}`}
        getData={getData}
        copyJsonActions={copyJsonActions}
        trigger={({ isExporting }) => (
          <Button
            variant="outline"
            size="icon"
            disabled={isExporting || rows?.length === 0 || isPending}
          >
            <LoadingContent loading={isExporting}>
              <RiExportLine />
            </LoadingContent>
          </Button>
        )}
      />
    </div>
  )
}
