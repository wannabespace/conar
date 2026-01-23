import type { LinkProps } from '@tanstack/react-router'
import type { connections } from '~/drizzle'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useDefaultLayout } from 'react-resizable-panels'

export const Route = createFileRoute(
  '/_protected/database/$id/definitions',
)({
  component: DefinitionsSideTabsLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith('/definitions') || location.pathname.endsWith('/definitions/')) {
      throw redirect({
        to: '/database/$id/definitions/indexes',
        params: { id: params.id },
        replace: true,
      })
    }
  },
})

function SidebarLink(props: LinkProps) {
  return (
    <Button
      variant="ghost"
      asChild
      className="w-full justify-start gap-2 border border-transparent"
    >
      <Link
        activeProps={{ className: 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20' }}
        {...props}
      />
    </Button>
  )
}

function DefinitionsSideTabsLayout() {
  const { id } = Route.useParams()
  const { connection } = Route.useRouteContext() as { connection: typeof connections.$inferSelect }

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: `database-definitions-layout-${connection.id}`,
    storage: localStorage,
  })

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
      orientation="horizontal"
      className="flex size-full"
    >
      <ResizablePanel
        defaultSize="20%"
        minSize="10%"
        maxSize="30%"
        className="h-full rounded-lg border bg-background"
      >
        <aside className="h-full flex-col p-4">
          <CardTitle className="mb-4">Definitions</CardTitle>

          <nav className="space-y-1">
            <SidebarLink
              to="/database/$id/definitions/indexes"
              params={{ id }}
            >
              <RiFileList3Line className="size-4" />
              Indexes
            </SidebarLink>
            <SidebarLink
              to="/database/$id/definitions/constraints"
              params={{ id }}
            >
              <RiKey2Line className="size-4" />
              Constraints
            </SidebarLink>
            <SidebarLink
              to="/database/$id/definitions/enums"
              params={{ id }}
            >
              <RiListUnordered className="size-4" />
              Enums
              {connection.type === ConnectionType.MySQL && ' & Sets'}
            </SidebarLink>
          </nav>
        </aside>
      </ResizablePanel>

      <ResizableSeparator className="w-1 bg-transparent" />

      <ResizablePanel
        defaultSize="80%"
        className="flex-1 rounded-lg border bg-background"
      >
        <main className="size-full overflow-auto">
          <Outlet />
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
