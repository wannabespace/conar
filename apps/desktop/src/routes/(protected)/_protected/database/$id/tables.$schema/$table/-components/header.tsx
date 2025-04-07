import type { QueryKey } from '@tanstack/react-query'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiLoopLeftLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { use } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseRowsQuery, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { TableContext } from '..'

export function TableHeader({ queryKey, columnsCount }: { queryKey: QueryKey, columnsCount: number }) {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { setPage, pageSize, total } = use(TableContext)
  const { isFetching, dataUpdatedAt } = useQuery(databaseRowsQuery(database, table, schema, { page: 1, limit: pageSize }))

  async function handleRefresh() {
    setPage(1)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) }),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
    toast.success('Data refreshed')
  }

  return (
    <div className="flex gap-6 flex-row items-center justify-between p-4">
      <div>
        <h2 className="font-medium text-sm mb-0.5 space-x-1">
          <span className="text-muted-foreground">
            {schema}
          </span>
          {' '}
          <span className="text-muted-foreground/20">/</span>
          {' '}
          <span>{table}</span>
        </h2>
        <p className="text-muted-foreground text-xs">
          {columnsCount}
          {' '}
          column
          {columnsCount === 1 ? '' : 's'}
          {' '}
          •
          {' '}
          {total ?? '...'}
          {' '}
          row
          {total === 1 ? '' : 's'}
        </p>
      </div>
      <div>
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
                  <RiLoopLeftLine />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Refresh data
              <p className="text-xs text-muted-foreground">
                Table data is cached. Click to fetch the latest data.
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated:
                {' '}
                {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
