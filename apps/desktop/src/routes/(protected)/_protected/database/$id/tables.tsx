import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { useWindowSize } from '@react-hookz/web'
import { createFileRoute, Outlet } from '@tanstack/react-router'
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

  function px(value: number) {
    return value / width * 100
  }

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${database.id}`} direction="horizontal" className="flex h-auto!">
      <ResizablePanel defaultSize={px(300)} minSize={px(150)} maxSize={50} className="flex flex-col gap-4">
        <div className="p-4 pb-0">
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
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
