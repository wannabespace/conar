import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle/schema'
import type { FileRoutesByTo } from '~/routeTree.gen'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { CardTitle } from '@conar/ui/components/card'
import { RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { SidebarLink } from '~/components/sidebar-link'
import { Route } from '../../definitions'

function sidebarItems(connection: typeof connections.$inferSelect) {
  return [
    {
      to: '/connection/$resourceId/definitions/enums',
      Icon: RiListUnordered,
      label: connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
    },
    {
      to: '/connection/$resourceId/definitions/indexes',
      Icon: RiFileList3Line,
      label: 'Indexes',
    },
    {
      to: '/connection/$resourceId/definitions/constraints',
      Icon: RiKey2Line,
      label: 'Constraints',
    },
  ] satisfies { Icon: RemixiconComponentType, label: string, to: keyof FileRoutesByTo }[]
}

export function Sidebar() {
  const { connection, connectionResource } = Route.useRouteContext()

  return (
    <aside className="h-full w-64 flex-col rounded-lg bg-background p-4">
      <CardTitle className="mb-4">Definitions</CardTitle>
      <nav className="space-y-1">
        {sidebarItems(connection).map(({ to, Icon, label }) => (
          <SidebarLink
            key={to}
            to={to}
            params={{ resourceId: connectionResource.id }}
          >
            <Icon className="size-4" />
            {label}
          </SidebarLink>
        ))}
      </nav>
    </aside>
  )
}
