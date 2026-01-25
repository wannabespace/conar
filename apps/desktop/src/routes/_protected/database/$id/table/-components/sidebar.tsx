import { CardTitle } from '@conar/ui/components/card'
import { RefreshButton } from '@conar/ui/components/custom/refresh-button'
import { Input } from '@conar/ui/components/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCloseLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { connectionConstraintsQuery, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { queryClient } from '~/main'
import { Route } from '..'
import { TablesTree } from './tables-tree'

export function Sidebar() {
  const { connection } = Route.useLoaderData()
  const { data: tablesAndSchemas, refetch: refetchTablesAndSchemas, isFetching: isRefreshingTablesAndSchemas, dataUpdatedAt } = useConnectionTablesAndSchemas({ connection })
  const store = connectionStore(connection.id)
  const search = useStore(store, state => state.tablesSearch)

  async function handleRefresh() {
    await Promise.all([
      refetchTablesAndSchemas(),
      queryClient.invalidateQueries(connectionConstraintsQuery({ connection })),
    ])
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Tables</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <RefreshButton
                  variant="outline"
                  size="icon-sm"
                  onClick={handleRefresh}
                  loading={isRefreshingTablesAndSchemas}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                Refresh tables and schemas list
                <p className="text-xs text-muted-foreground">
                  Last updated:
                  {' '}
                  {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!!tablesAndSchemas && tablesAndSchemas.totalTables > 10 && (
          <div className="relative">
            <Input
              placeholder="Search tables"
              className="pr-8"
              value={search}
              onChange={e => store.setState(state => ({ ...state, tablesSearch: e.target.value } satisfies typeof state))}
            />
            {search && (
              <button
                type="button"
                className={`
                  absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
                `}
                onClick={() => store.setState(state => ({ ...state, tablesSearch: '' } satisfies typeof state))}
              >
                <RiCloseLine className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <TablesTree className="flex-1" search={search} />
      </div>
    </div>
  )
}
