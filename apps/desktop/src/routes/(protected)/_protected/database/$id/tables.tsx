import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useAsyncEffect } from '@connnect/ui/hooks/use-async-effect'
import { RiLoopLeftLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'
import { toast } from 'sonner'
import { databaseSchemas, databaseSchemasQuery, databaseTablesQuery, useDatabase, useDatabaseSchemas, useDatabaseTables } from '~/entities/database'
import { queryClient } from '~/main'
import { TablesTree } from './-components/tables-tree'

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
  const [schema, setSchema] = useState(databaseSchemas.get(id))
  const { data: tables } = useDatabaseTables(database, schema)
  const [searchQuery, setSearchQuery] = useState('')
  const search = useDeferredValue(searchQuery)

  useAsyncEffect(async () => {
    databaseSchemas.set(id, schema)
  }, [id, schema])

  const { mutate: refreshTables, isPending: isRefreshingTables } = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: databaseTablesQuery(database, schema).queryKey }),
        queryClient.invalidateQueries({ queryKey: databaseSchemasQuery(database).queryKey }),
      ])
    },
    onSuccess: () => {
      toast.success('Tables and schemas successfully refreshed')
    },
  })

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${database.id}`} direction="horizontal" className="flex h-auto!">
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="flex flex-col gap-2 h-screen bg-muted/20"
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
                    onClick={() => refreshTables()}
                    disabled={isRefreshingTables}
                  >
                    <LoadingContent loading={isRefreshingTables}>
                      <RiLoopLeftLine />
                    </LoadingContent>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Refresh tables and schemas list
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {schemas?.length && (
            <Select
              value={schema}
              onValueChange={setSchema}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    schema
                  </span>
                  <SelectValue placeholder="Select schema" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {schemas?.map(schema => (
                  <SelectItem
                    key={schema.name}
                    value={schema.name}
                    onMouseOver={() => queryClient.ensureQueryData(databaseTablesQuery(database, schema.name))}
                  >
                    {schema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!!tables && tables.length > 10 && (
            <Input
              placeholder="Search tables"
              className="w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          )}
        </div>
        <TablesTree
          className="flex-1"
          database={database}
          schema={schema}
          search={search}
        />
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
