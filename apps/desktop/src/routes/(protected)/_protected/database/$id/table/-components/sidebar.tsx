import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useSessionStorage } from '@conar/ui/hookas/use-session-storage'
import { RiCheckLine, RiCloseLine, RiLoopLeftLine } from '@remixicon/react'
import { useDatabaseTablesAndSchemas } from '~/entities/database'
import { databaseForeignKeysQuery } from '~/entities/database/queries/foreign-keys'
import { queryClient } from '~/main'
import { TablesTree } from './tables-tree'

export function Sidebar({ database }: { database: typeof databases.$inferSelect }) {
  const { data: tablesAndSchemas, refetch: refetchTablesAndSchemas, isFetching: isRefreshingTablesAndSchemas, dataUpdatedAt } = useDatabaseTablesAndSchemas({ database })
  const [search, setSearch] = useSessionStorage(`database-tables-search-${database.id}`, '')

  async function handleRefresh() {
    await Promise.all([
      refetchTablesAndSchemas(),
      queryClient.invalidateQueries(databaseForeignKeysQuery({ database })),
    ])
  }

  return (
    <>
      <div className="flex flex-col gap-2 p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Tables</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleRefresh}
                >
                  <LoadingContent loading={isRefreshingTablesAndSchemas}>
                    <ContentSwitch
                      activeContent={<RiCheckLine className="text-success" />}
                      active={isRefreshingTablesAndSchemas}
                    >
                      <RiLoopLeftLine />
                    </ContentSwitch>
                  </LoadingContent>
                </Button>
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
        {!!tablesAndSchemas && tablesAndSchemas.totalTables > 20 && (
          <div className="relative">
            <Input
              placeholder="Search tables"
              className="pr-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
                onClick={() => setSearch('')}
              >
                <RiCloseLine className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
      <TablesTree
        className="flex-1"
        database={database}
        search={search}
      />
    </>
  )
}
