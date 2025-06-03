import { title } from '@connnect/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Tabs, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { useLocalStorage } from '@connnect/ui/hookas/use-local-storage'
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { ensureDatabaseTableCore, useDatabase } from '~/entities/database'
import { Sidebar } from './-components/sidebar'
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
        <Sidebar database={database} />
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
