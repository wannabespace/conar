import type { connections } from '~/drizzle'
import type { Definitions } from '~/entities/connection/store'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { Input } from '@conar/ui/components/input'
import { ResizablePanel } from '@conar/ui/components/resizable'
import { RiCloseLine, RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { connectionStore } from '~/entities/connection/store'

import { SidebarLink } from './sidebar-link'

interface SidebarProps {
  connection: typeof connections.$inferSelect
  updateLastOpened: (pathSegment: Definitions) => void
  id: string
}

function sidebarItems(connection: typeof connections.$inferSelect) {
  return [
    {
      id: 'indexes' as const,
      icon: RiFileList3Line,
      label: 'Indexes',
    },
    {
      id: 'constraints' as const,
      icon: RiKey2Line,
      label: 'Constraints',
    },
    {
      id: 'enums' as const,
      icon: RiListUnordered,
      label: connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
    },
  ]
}

export function Sidebar({ connection, updateLastOpened, id }: SidebarProps) {
  const search = useStore(connectionStore(id), state => state.definitionsSearch)
  const store = connectionStore(id)

  return (
    <ResizablePanel
      defaultSize="25%"
      minSize="10%"
      maxSize="30%"
      className="h-full rounded-lg border bg-background"
    >
      <aside className="h-full flex-col p-4">
        <CardTitle className="mb-4">Definitions</CardTitle>

        <div className="relative mb-2">
          <Input
            value={search}
            onChange={e => store.setState(state => ({ ...state, definitionsSearch: e.target.value }))}
            placeholder="Search Definitions"
            className="pr-8"
          />
          {search && (
            <button
              type="button"
              className="
                absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
              "
              onClick={() => store.setState(state => ({ ...state, definitionsSearch: '' }))}
            >
              <RiCloseLine className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {sidebarItems(connection)
            .filter(item => !search || item.label.toLowerCase().includes(search.toLowerCase()))
            .map(item => (
              <SidebarLink
                key={item.id}
                to={`/database/$id/definitions/${item.id}`}
                params={{ id }}
                onClick={() => updateLastOpened(item.id)}
              >
                <item.icon className="size-4" />
                <HighlightText text={item.label} match={search} />
              </SidebarLink>
            ))}
        </nav>
      </aside>
    </ResizablePanel>
  )
}
