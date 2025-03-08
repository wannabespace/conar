import { Button } from '@connnect/ui/components/button'
import { Card } from '@connnect/ui/components/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { RiDatabase2Line } from '@remixicon/react'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { PAGE_SCREEN_CLASS } from '~/constants'
import { useConnection, useDatabaseSchemas } from '~/entities/connection'
import { DatabaseTree } from './-components/database-tree'
import { PasswordForm } from './-components/password-form'
import { useDatabaseSchema } from './-hooks/schema'

export const Route = createFileRoute('/(protected)/_dashboard/database/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { id } = Route.useParams()
  const { data: connection } = useConnection(id)
  const [schema, setSchema] = useDatabaseSchema(id)
  const { data: schemas } = useDatabaseSchemas(connection)

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return <PasswordForm connection={connection} />
  }

  return (
    <ResizablePanelGroup className={PAGE_SCREEN_CLASS} direction="horizontal">
      <ResizablePanel defaultSize={20} minSize={10}>
        <Card className="h-full">
          <ScrollArea>
            <Button variant="outline" onClick={() => router.navigate({ to: '/database/$id/sql', params: { id } })}>
              Run SQL
              <RiDatabase2Line />
            </Button>
            <div className="p-3">
              <Select value={schema} onValueChange={setSchema}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select schema" />
                </SelectTrigger>
                <SelectContent>
                  {schemas?.map(schema => (
                    <SelectItem key={schema.schema_name} value={schema.schema_name}>
                      {schema.schema_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DatabaseTree connection={connection} schema={schema} />
          </ScrollArea>
        </Card>
      </ResizablePanel>
      <ResizableHandle className="w-1 mx-0.5" />
      <ResizablePanel defaultSize={80} minSize={50} maxSize={80}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
