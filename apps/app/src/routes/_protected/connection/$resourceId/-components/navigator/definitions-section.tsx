import {
  FlashIcon,
  HierarchyIcon,
  Key01Icon,
  LeftToRightListBulletIcon,
  LeftToRightListDashIcon,
  Search01Icon,
  SecurityCheckIcon,
  SourceCodeIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
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

interface NavigatorItem {
  Icon: IconSvgElement
  label: string
  open: (resourceId: string, preview: boolean) => void
  tabId: string
}

const sectionItem = (
  Icon: IconSvgElement,
  label: string,
  section: DefinitionsSection
): NavigatorItem => ({
  Icon,
  label,
  open: (resourceId, preview) =>
    openDefinitionsTab(resourceId, section, preview),
  tabId: definitionsTabId(section),
})

const visualizerItem: NavigatorItem = {
  Icon: HierarchyIcon,
  label: 'Visualizer',
  open: openVisualizerTab,
  tabId: VISUALIZER_TAB_ID,
}

export const schemaGroups = (
  connection: Connection
): { items: NavigatorItem[]; label: string }[] =>
  [
    {
      items: [visualizerItem],
      label: 'Overview',
    },
    {
      items: [
        sectionItem(LeftToRightListDashIcon, 'Indexes', 'indexes'),
        sectionItem(Key01Icon, 'Constraints', 'constraints'),
      ],
      label: 'Structure',
    },
    {
      items: [
        sectionItem(
          LeftToRightListBulletIcon,
          connection.type === ConnectionType.MySQL ? 'Enums & Sets' : 'Enums',
          'enums'
        ),
      ],
      label: 'Types',
    },
    {
      items: [
        ...(CONNECTION_TYPES_WITH_FUNCTIONS.includes(connection.type)
          ? [sectionItem(SourceCodeIcon, 'Functions', 'functions')]
          : []),
        ...(CONNECTION_TYPES_WITH_TRIGGERS.includes(connection.type)
          ? [sectionItem(FlashIcon, 'Triggers', 'triggers')]
          : []),
      ],
      label: 'Logic',
    },
    {
      items: [sectionItem(SecurityCheckIcon, 'Policies', 'policies')],
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
      <div className="flex shrink-0 items-center gap-1 pb-1.5 pl-2">
        <InputGroup className="flex-1" size="sm">
          <InputGroupAddon>
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="text-muted-foreground/70 size-3.5"
            />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
            className="text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>
      <SidebarContent className="scroll-fade min-h-0 flex-1 gap-3 pb-2 pl-2">
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
            {group.items.map(({ Icon, label, open, tabId }) => {
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
                        onClick={() => open(connectionResource.id, true)}
                        onDoubleClick={() => open(connectionResource.id, false)}
                      />
                    }
                  >
                    <HugeiconsIcon
                      icon={Icon}
                      strokeWidth={2}
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
