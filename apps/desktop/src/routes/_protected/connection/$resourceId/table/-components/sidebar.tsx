import { CONNECTION_TYPES_WITHOUT_SYSTEM_TABLES } from '@conar/shared/constants'
import { RefreshButton } from '@conar/ui/components/custom/refresh-button'
import { Input } from '@conar/ui/components/input'
import { Switch } from '@conar/ui/components/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCloseLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useSubscription } from 'seitu/react'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { Route } from '..'
import { TablesTree } from './tables-tree'

export function Sidebar() {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const search = useSubscription(store, { selector: state => state.tablesSearch })
  const { data: tablesAndSchemas, refetch: refetchTablesAndSchemas, isFetching: isRefreshingTablesAndSchemas, dataUpdatedAt } = useQuery(resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }))

  useRefreshHotkey(refetchTablesAndSchemas, isRefreshingTablesAndSchemas)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Tables</h2>
          <div className="flex items-center gap-4">
            {!CONNECTION_TYPES_WITHOUT_SYSTEM_TABLES.includes(connection.type) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Switch
                    checked={showSystem}
                    onCheckedChange={value => store.set(state => ({ ...state, showSystem: value } satisfies typeof state))}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Show system tables
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <RefreshButton
                  variant="outline"
                  size="icon"
                  onClick={() => refetchTablesAndSchemas()}
                  refreshing={isRefreshingTablesAndSchemas}
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
          </div>
        </div>
        {!!tablesAndSchemas && tablesAndSchemas.totalTables > 10 && (
          <div className="relative">
            <Input
              placeholder="Search tables"
              className="pr-8"
              value={search}
              onChange={e => store.set(state => ({ ...state, tablesSearch: e.target.value } satisfies typeof state))}
            />
            {search && (
              <button
                type="button"
                className={`
                  absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
                `}
                onClick={() => store.set(state => ({ ...state, tablesSearch: '' } satisfies typeof state))}
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
