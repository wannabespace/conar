import { title } from '@connnect/shared/utils/title'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { ContentSwitch } from '@connnect/ui/components/custom/content-switch'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Tabs, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useLocalStorage } from '@connnect/ui/hookas/use-local-storage'
import { useSessionStorage } from '@connnect/ui/hookas/use-session-storage'
import { RiCheckLine, RiCloseLine, RiLoopLeftLine } from '@remixicon/react'
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { ensureDatabaseTableCore, useDatabase, useDatabaseTablesAndSchemas } from '~/entities/database'
import { TablesTree } from './-components/tables-tree'
import { getTableStoreState } from './tables.$schema/$table'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables',
)({
  component: DatabaseTablesPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title('Tables', loaderData.database.name),
          },
        ]
      : [],
  }),
})

function DatabaseTablesPage() {
  const { id } = Route.useParams()
  const { schema: schemaParam } = useParams({ strict: false })
  const navigate = useNavigate()
  const { table: tableParam } = useParams({ strict: false })
  const [tabs, setTabs] = useLocalStorage<{
    table: string
    schema: string
    order: number
  }[]>(`database-tables-tabs-${id}`, [])
  const { data: database } = useDatabase(id)
  const { data: tablesAndSchemas, refetch: refetchTablesAndSchemas, isFetching: isRefreshingTablesAndSchemas, dataUpdatedAt } = useDatabaseTablesAndSchemas(database)
  const [search, setSearch] = useSessionStorage(`database-tables-search-${id}`, '')

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getTableStoreState(schemaParam, tableName) : null

    if (state) {
      return {
        filters: state.filters,
        orderBy: state.orderBy,
      }
    }

    return {
      filters: [],
      orderBy: {},
    }
  }

  function ensureTab(schema: string, table: string) {
    if (tabs.find(tab => tab.table === table && tab.schema === schema)) {
      return
    }

    setTabs(prev => [...prev, {
      table,
      schema,
      order: prev.length + 1,
    }])
  }

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${id}`} direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="flex flex-col h-full border bg-background rounded-lg"
      >
        <div className="flex flex-col gap-2 p-4 pb-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Tables</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="iconSm"
                    onClick={() => refetchTablesAndSchemas()}
                  >
                    <LoadingContent loading={isRefreshingTablesAndSchemas}>
                      <ContentSwitch
                        activeContent={<RiCheckLine className="text-success" />}
                        active={!isRefreshingTablesAndSchemas}
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
      </ResizablePanel>
      <ResizableHandle className="w-2 bg-transparent" />
      <ResizablePanel defaultSize={80} className="flex-1 border bg-background rounded-lg">
        {schemaParam && tableParam
          ? (
              <>
                <div className="h-8">
                  <Tabs value={tableParam}>
                    <TabsList>
                      {tabs.map(tab => (
                        <TabsTrigger
                          key={tab.table}
                          value={tab.table}
                          onClick={() => navigate({ to: `/database/${id}/tables/${tab.schema}/${tab.table}` })}
                          onMouseOver={() => ensureDatabaseTableCore(database, tab.schema, tab.table, getQueryOpts(tab.table))}
                        >
                          {tab.table}
                        </TabsTrigger>
                      ))}
                      {!tabs.find(tab => tab.table === tableParam && tab.schema === schemaParam) && (
                        <TabsTrigger
                          value={tableParam!}
                          onClick={() => navigate({ to: `/database/${id}/tables/${schemaParam}/${tableParam}` })}
                          onDoubleClick={() => ensureTab(schemaParam, tableParam)}
                        >
                          {tableParam}
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </Tabs>
                </div>
                <div
                  key={tableParam}
                  className="h-[calc(100%-theme(spacing.8))]"
                  onClick={() => ensureTab(schemaParam, tableParam)}
                >
                  <Outlet />
                </div>
              </>
            )
          : (
              <div className="p-4 flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="text-lg font-medium">
                    No table selected
                  </div>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Select a schema from the dropdown and choose a table from the sidebar to view and manage your data.
                  </p>
                </div>
              </div>
            )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
