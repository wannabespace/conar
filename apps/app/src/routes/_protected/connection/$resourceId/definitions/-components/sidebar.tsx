import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiCodeSSlashLine,
  RiFileList3Line,
  RiFlashlightLine,
  RiKey2Line,
  RiListUnordered,
  RiShieldCheckLine,
} from '@remixicon/react'
import {
  CONNECTION_TYPES_WITH_FUNCTIONS,
  CONNECTION_TYPES_WITH_TRIGGERS,
} from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { SidebarLink } from '~/components/sidebar-link'
import type { Connection } from '~/entities/connection/core'
import type { FileRoutesByTo } from '~/routeTree.gen'

import { Route } from '../../definitions'

function sidebarItems(connection: Connection) {
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
    {
      to: '/connection/$resourceId/definitions/policies',
      Icon: RiShieldCheckLine,
      label: 'Policies',
    },
    ...(CONNECTION_TYPES_WITH_FUNCTIONS.includes(connection.type)
      ? [
          {
            to: '/connection/$resourceId/definitions/functions' as const,
            Icon: RiCodeSSlashLine,
            label: 'Functions',
          },
        ]
      : []),
    ...(CONNECTION_TYPES_WITH_TRIGGERS.includes(connection.type)
      ? [
          {
            to: '/connection/$resourceId/definitions/triggers' as const,
            Icon: RiFlashlightLine,
            label: 'Triggers',
          },
        ]
      : []),
  ] satisfies { Icon: RemixiconComponentType; label: string; to: keyof FileRoutesByTo }[]
}

export function Sidebar() {
  const { connection, connectionResource } = Route.useRouteContext()

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col">
      <div
        className="
          px-3 pt-3 pb-1.5 text-2xs font-semibold tracking-wider
          text-muted-foreground uppercase select-none
        "
      >
        Definitions
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {sidebarItems(connection).map(({ to, Icon, label }) => (
          <SidebarLink key={to} to={to} params={{ resourceId: connectionResource.id }}>
            <Icon />
            {label}
          </SidebarLink>
        ))}
      </nav>
    </aside>
  )
}
