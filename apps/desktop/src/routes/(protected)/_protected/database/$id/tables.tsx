import { px } from '@connnect/shared/utils/helpers'
import { CardTitle } from '@connnect/ui/components/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { useWindowSize } from '@react-hookz/web'
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import { databaseColumnsQuery, databaseTablesQuery, useDatabase, useDatabaseSchemas } from '~/entities/database'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { queryClient } from '~/main'
import { TablesTree } from '../-components/tables-tree'
import { useDatabaseSchema } from '../-hooks/schema'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { table: tableParam } = useParams({ strict: false })
  const { data: database } = useDatabase(id)
  const { data: schemas } = useDatabaseSchemas(database)
  const [schema, setSchema] = useDatabaseSchema(id)

  useAsyncEffect(async () => {
    const tables = await queryClient.ensureQueryData(databaseTablesQuery(database))

    tables.forEach((table) => {
      queryClient.ensureQueryData(databaseColumnsQuery(database, table.name, schema))
    })
  }, [schema])

  const { width } = useWindowSize()

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${database.id}`} direction="horizontal" className="flex h-auto!">
      <ResizablePanel
        defaultSize={px(300, width)}
        minSize={px(150, width)}
        maxSize={50}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-4 p-4 pb-0">
          <CardTitle>Tables</CardTitle>
          <Select
            value={schema}
            onValueChange={setSchema}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select schema" />
            </SelectTrigger>
            <SelectContent>
              {schemas?.map(schema => (
                <SelectItem
                  key={schema.schema_name}
                  value={schema.schema_name}
                  onMouseEnter={() => queryClient.ensureQueryData(databaseTablesQuery(database, schema.schema_name))}
                >
                  {schema.schema_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto">
          <TablesTree database={database} schema={schema} />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75} className="flex-1">
        <Outlet />
        {!tableParam && (
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
