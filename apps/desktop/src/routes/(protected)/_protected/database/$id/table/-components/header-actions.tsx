import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiCheckLine, RiCloseLine, RiExportLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useCallback, useState } from 'react'
import { ExportData } from '~/components/export-data'
import { databaseConstraintsQuery, databaseRowsQuery, databaseTableColumnsQuery, rowsQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { usePageStoreContext } from '../-store'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'

function HeaderActionsOrder() {
  const store = usePageStoreContext()
  const orderBy = useStore(store, state => state.orderBy)
  const [open, setOpen] = useState(false)

  const setOrder = useCallback((columnId: string, order: 'ASC' | 'DESC') => {
    store.setState(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [columnId]: order,
      },
    }))
  }, [store])

  const removeOrder = useCallback((columnId: string) => {
    const newOrderBy = { ...store.state.orderBy }
    delete newOrderBy[columnId]

    store.setState(state => ({
      ...state,
      orderBy: newOrderBy,
    }))
  }, [store])

  const orderEntries = Object.entries(orderBy || {})
  const hasOrders = orderEntries.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={hasOrders ? 'text-primary' : ''}
              >
                <RiArrowUpDownLine />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            Sort order
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-72" side="bottom" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Sort Order</h4>

          {orderEntries.length === 0
            ? (
                <div className="text-sm text-muted-foreground">
                  No sort order applied. Click on column headers to sort.
                </div>
              )
            : (
                <div className="space-y-2">
                  {orderEntries.map(([columnId, order]) => (
                    <div key={columnId} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[150px]" title={columnId}>
                        {columnId}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={order === 'ASC' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOrder(columnId, 'ASC')}
                          className="h-7 px-2"
                        >
                          <RiArrowUpLine className="size-4 mr-1" />
                          ASC
                        </Button>
                        <Button
                          variant={order === 'DESC' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOrder(columnId, 'DESC')}
                          className="h-7 px-2"
                        >
                          <RiArrowDownLine className="size-4 mr-1" />
                          DESC
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeOrder(columnId)}
                          className="h-7"
                        >
                          <RiCloseLine className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function HeaderActions({ table, schema, database }: { table: string, schema: string, database: typeof databases.$inferSelect }) {
  const store = usePageStoreContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])
  const { isFetching, dataUpdatedAt, refetch, data: rows, isPending } = useInfiniteQuery(
    databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }),
  )

  async function handleRefresh() {
    refetch()
    queryClient.invalidateQueries(databaseTableColumnsQuery({ database, table, schema }))
    queryClient.invalidateQueries(databaseConstraintsQuery({ database }))
  }

  const getAllData = async () => {
    const data: Record<string, unknown>[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const batch = await rowsQuery.run(database, {
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

  const getLimitedData = async (limit: number) => rowsQuery.run(database, {
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

  return (
    <div className="flex items-center gap-2">
      <HeaderActionsDelete
        table={table}
        schema={schema}
        database={database}
      />
      <HeaderActionsColumns
        database={database}
        table={table}
        schema={schema}
      />
      <HeaderActionsFilters />
      <HeaderActionsOrder />
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
