import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiCodeSSlashLine,
  RiFileList3Line,
  RiFlashlightLine,
  RiKey2Line,
  RiListUnordered,
  RiNodeTree,
  RiSearchLine,
  RiShieldCheckLine,
} from '@remixicon/react'
import {
  CONNECTION_TYPES_WITH_FUNCTIONS,
  CONNECTION_TYPES_WITH_TRIGGERS,
} from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { Link } from '~/components/link'
import type { Connection } from '~/entities/connection/core'
import type { DefinitionsSection } from '~/entities/connection/store'
import {
  definitionsTabId,
  openDefinitionsTab,
  openVisualizerTab,
  VISUALIZER_TAB_ID,
} from '~/entities/connection/store'

import {
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './primitives'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface SchemaItem {
  Icon: RemixiconComponentType
  label: string
  onOpen: (resourceId: string) => void
  onPromote?: (resourceId: string) => void
  tabId: string
}

interface SchemaGroup {
  items: SchemaItem[]
  label: string
}

const sectionItem = (
  Icon: RemixiconComponentType,
  label: string,
  section: DefinitionsSection
): SchemaItem => ({
  Icon,
  label,
  onOpen: (resourceId) => openDefinitionsTab(resourceId, section, true),
  onPromote: (resourceId) => openDefinitionsTab(resourceId, section),
  tabId: definitionsTabId(section),
})

export const schemaGroups = (connection: Connection): SchemaGroup[] =>
  [
    {
      items: [
        {
          Icon: RiNodeTree,
          label: 'Visualizer',
          onOpen: openVisualizerTab,
          tabId: VISUALIZER_TAB_ID,
        },
      ],
      label: 'Overview',
    },
    {
      items: [
        sectionItem(RiFileList3Line, 'Indexes', 'indexes'),
        sectionItem(RiKey2Line, 'Constraints', 'constraints'),
      ],
      label: 'Structure',
    },
    {
      items: [
        sectionItem(
          RiListUnordered,
          connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
          'enums'
        ),
      ],
      label: 'Types',
    },
    {
      items: [
        ...(CONNECTION_TYPES_WITH_FUNCTIONS.includes(connection.type)
          ? [sectionItem(RiCodeSSlashLine, 'Functions', 'functions')]
          : []),
        ...(CONNECTION_TYPES_WITH_TRIGGERS.includes(connection.type)
          ? [sectionItem(RiFlashlightLine, 'Triggers', 'triggers')]
          : []),
      ],
      label: 'Logic',
    },
    {
      items: [sectionItem(RiShieldCheckLine, 'Policies', 'policies')],
      label: 'Security',
    },
  ].filter((group) => group.items.length > 0)

export const DefinitionsPanel = () => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const filtered = schemaGroups(connection)
    .map((group) => ({
      ...group,
      items: group.items.filter(({ label }) =>
        label.toLowerCase().includes(query)
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 px-2 pb-1.5">
        <InputGroup className="bg-input/60 h-7 flex-1 rounded-md">
          <InputGroupAddon>
            <RiSearchLine className="text-muted-foreground/70 size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
            className="text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>
      <SidebarContent className="scroll-fade min-h-0 flex-1 gap-3 px-2 pb-2">
        {filtered.length === 0 && (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Nothing found
          </p>
        )}
        {filtered.map((group) => (
          <SidebarMenu key={group.label}>
            <SidebarGroupLabel className="text-muted-foreground h-6 px-2 text-xs font-[450]">
              {group.label}
            </SidebarGroupLabel>
            {group.items.map(({ Icon, label, onOpen, onPromote, tabId }) => {
              const isActive = activeTabId === tabId

              return (
                <SidebarMenuItem key={tabId}>
                  <SidebarMenuButton
                    isActive={isActive}
                    className="text-foreground hover:text-foreground data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground h-7 cursor-default gap-2 rounded-md px-2 text-sm font-[450] data-active:font-[450]"
                    render={
                      <Link
                        to="/connection/$resourceId/$tabId"
                        params={{
                          resourceId: connectionResource.id,
                          tabId,
                        }}
                        preload="intent"
                        preloadDelay={200}
                        onClick={() => onOpen(connectionResource.id)}
                        onDoubleClick={() => onPromote?.(connectionResource.id)}
                      />
                    }
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span className="truncate">
                      <HighlightText text={label} match={search} />
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        ))}
      </SidebarContent>
    </>
  )
}
