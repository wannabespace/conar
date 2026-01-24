import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle'
import type { FileRoutesByTo } from '~/routeTree.gen'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { connectionStore } from '~/entities/connection/store'
import { router } from '~/main'
import { SidebarLink } from './sidebar-link'

interface SidebarProps {
  connection: typeof connections.$inferSelect
  id: string
}

function sidebarItems(connection: typeof connections.$inferSelect) {
  return [
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
    {
      to: '/database/$id/definitions/enums',
      Icon: RiListUnordered,
      label: connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
    },
  ] satisfies { Icon: RemixiconComponentType, label: string, to: keyof FileRoutesByTo }[]
}

export function Sidebar({ connection, id }: SidebarProps) {
  const search = useStore(connectionStore(id), state => state.definitionsSearch)
  const match = useMatches({
    select: matches => matches.map(match => router.routesById[match.routeId].to).at(-1),
  })

  return (
    <aside className="h-full flex-col rounded-lg border bg-background p-4 w-64">
      <CardTitle className="mb-4">Definitions</CardTitle>
      <nav className="space-y-1">
        {sidebarItems(connection)
          .map(({ to, Icon, label }) => (
            <SidebarLink
              key={to}
              to={to}
              params={{ id }}
              active={match === to}
            >
              <Icon className="size-4" />
              <HighlightText text={label} match={search} />
            </SidebarLink>
          ))}
      </nav>
    </aside>
  )
}
