import { Button } from '@connnect/ui/components/button'
import { ContentSwitch } from '@connnect/ui/components/custom/content-switch'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiCheckLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { databaseColumnsQuery, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { Route, usePageContext } from '..'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'

export function HeaderActions() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { store } = usePageContext()
  const rowsQueryOpts = useRowsQueryOpts()
  const { isFetching, dataUpdatedAt, refetch } = useInfiniteQuery(rowsQueryOpts)

  async function handleRefresh() {
    store.setState(state => ({
      ...state,
      page: 1,
    }))
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
  }

  return (
    <div className="flex gap-2">
      <HeaderActionsDelete />
      <HeaderActionsColumns />
      <HeaderActionsFilters />
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
          <TooltipContent side="bottom" align="end">
            Refresh data
            <p className="text-xs text-muted-foreground">
              Last updated:
              {' '}
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
