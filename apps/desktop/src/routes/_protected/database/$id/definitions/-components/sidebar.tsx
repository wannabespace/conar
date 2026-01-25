import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle'
import type { FileRoutesByTo } from '~/routeTree.gen'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { SidebarLink } from '~/components/sidebar-link'
import { connectionStore } from '~/entities/connection/store'
import { Route } from '../../definitions'

function sidebarItems(connection: typeof connections.$inferSelect) {
  return [
    {
      to: '/database/$id/definitions/enums',
      Icon: RiListUnordered,
      label: connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
    },
    {
      to: '/database/$id/definitions/indexes',
      Icon: RiFileList3Line,
      label: 'Indexes',
    },
    {
      to: '/database/$id/definitions/constraints',
      Icon: RiKey2Line,
      label: 'Constraints',
    },
  ] satisfies { Icon: RemixiconComponentType, label: string, to: keyof FileRoutesByTo }[]
}

export function Sidebar() {
  const { connection } = Route.useRouteContext()
  const search = useStore(connectionStore(connection.id), state => state.definitionsSearch)

  return (
    <aside className="h-full w-64 flex-col rounded-lg border bg-background p-4">
      <CardTitle className="mb-4">Definitions</CardTitle>
      <nav className="space-y-1">
        {sidebarItems(connection).map(({ to, Icon, label }) => (
          <SidebarLink
            key={to}
            to={to}
            params={{ id: connection.id }}
          >
            <Icon className="size-4" />
            <HighlightText text={label} match={search} />
          </SidebarLink>
        ))}
      </nav>
    </aside>
  )
}
