import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle/schema'
import type { FileRoutesByTo } from '~/routeTree.gen'
import { CONNECTION_TYPES_WITH_FUNCTIONS, CONNECTION_TYPES_WITH_TRIGGERS } from '@conar/shared/constants'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { RiCodeSSlashLine, RiFileList3Line, RiFlashlightLine, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { useSubscription } from 'seitu/react'
import { SidebarLink } from '~/components/sidebar-link'
import { getConnectionResourceStore } from '~/entities/connection/store'
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
    ...(CONNECTION_TYPES_WITH_FUNCTIONS.includes(connection.type)
      ? [{
          to: '/connection/$resourceId/definitions/functions' as const,
          Icon: RiCodeSSlashLine,
          label: 'Functions',
        }]
      : []),
    ...(CONNECTION_TYPES_WITH_TRIGGERS.includes(connection.type)
      ? [{
          to: '/connection/$resourceId/definitions/triggers' as const,
          Icon: RiFlashlightLine,
          label: 'Triggers',
        }]
      : []),
  ] satisfies { Icon: RemixiconComponentType, label: string, to: keyof FileRoutesByTo }[]
}

export function Sidebar() {
  const { connection, connectionResource } = Route.useRouteContext()
  const search = useSubscription(getConnectionResourceStore(connectionResource.id), { selector: state => state.definitionsSearch })

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
            <HighlightText text={label} match={search} />
          </SidebarLink>
        ))}
      </nav>
    </aside>
  )
}
