import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useConnection } from '~/entities/connection'
import { PasswordForm } from './-components/password-form'
import { ConnectionTree } from './-components/tree'

export const Route = createFileRoute('/(protected)/_dashboard/connections/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: connection } = useConnection(id)

  if (!connection) {
    return (
      <div className="flex w-full items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">Loading connection...</p>
      </div>
    )
  }

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return <PasswordForm connection={connection} />
  }

  return (
    <ResizablePanelGroup className="h-auto!" direction="horizontal">
      <ResizablePanel defaultSize={20} minSize={10}>
        <ConnectionTree />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80} minSize={50}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
