import type { Database } from '~/lib/indexeddb'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiLoopLeftLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { usePageContext } from '..'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'
import { HeaderActionsColumns } from './header-actions-columns'
import { HeaderActionsDelete } from './header-actions-delete'
import { HeaderActionsFilters } from './header-actions-filters'

export function HeaderActions({ table, schema, database }: { table: string, schema: string, database: Database }) {
  const { store } = usePageContext()
  const rowsQueryOpts = useRowsQueryOpts()
  const { isFetching, dataUpdatedAt, refetch } = useInfiniteQuery(rowsQueryOpts)

  async function handleRefresh() {
    store.setState(state => ({
      ...state,
      page: 1,
    }))
    await refetch()
  }

  return (
    <div className="flex gap-2">
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
    </div>
  )
}
