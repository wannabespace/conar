import type { LinkProps } from '@tanstack/react-router'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { Button } from '@conar/ui/components/button'
import { RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_protected/database/$id/definitions',
)({
  component: SideTabsLayout,
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
      className="w-full justify-start gap-2"
    >
      <Link
        activeProps={{ className: 'bg-accent/50' }}
        {...props}
      />
    </Button>
  )
}

function SideTabsLayout() {
  const { id } = Route.useParams()
  const { database } = Route.useRouteContext() as { database: typeof databases.$inferSelect }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <aside className="w-56 flex-none border-r bg-muted/10 p-4">
        <h2 className="mb-4 px-2 text-sm font-semibold text-muted-foreground">
          Tabs
        </h2>

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
            {database.type === DatabaseType.MySQL && ' & Sets'}
          </SidebarLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
