import { Button } from '@connnect/ui/components/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { RiDatabase2Line } from '@remixicon/react'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useConnection } from '~/entities/connection'
import { PasswordForm } from './$id/-components/password-form'
import { ConnectionTree } from './$id/-components/tree'

export const Route = createFileRoute('/(protected)/_dashboard/database/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
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
        <Button variant="outline" onClick={() => router.navigate({ to: '/database/$id/sql', params: { id } })}>
          Run SQL
          <RiDatabase2Line />
        </Button>
        <ConnectionTree connection={connection} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80} minSize={50}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
