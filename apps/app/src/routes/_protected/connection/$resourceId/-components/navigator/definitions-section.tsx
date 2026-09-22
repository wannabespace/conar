import { HierarchyIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
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
import { sectionAvailable } from '~/entities/connection/capabilities'
import type { Connection } from '~/entities/connection/core/sync'
import { sectionMetaOf } from '~/entities/connection/sections'
import {
  openDefinitionsTab,
  openVisualizerTab,
} from '~/entities/connection/store/helpers/tabs'
import {
  VISUALIZER_TAB_ID,
  definitionsTabId,
} from '~/entities/connection/store/tabs/ids'
import type { DefinitionsSection } from '~/entities/connection/store/tabs/types'

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
  section?: DefinitionsSection
  tabId: string
}

const sectionItem = (section: DefinitionsSection): NavigatorItem => {
  const { icon, title } = sectionMetaOf(section)

  return {
    Icon: icon,
    label: title,
    open: (resourceId, preview) =>
      openDefinitionsTab(resourceId, section, preview),
    section,
    tabId: definitionsTabId(section),
  }
}

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
      items: [sectionItem('indexes'), sectionItem('constraints')],
      label: 'Structure',
    },
    {
      items: [sectionItem('enums')],
      label: 'Types',
    },
    {
      items: [sectionItem('functions'), sectionItem('triggers')],
      label: 'Logic',
    },
    {
      items: [sectionItem('policies'), sectionItem('privileges')],
      label: 'Security',
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ({ section }) => !section || sectionAvailable(section, connection.type)
      ),
    }))
    .filter((group) => group.items.length > 0)

export const DefinitionsPanel = () => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const [search, setSearch] = useState('')

  const filtered = schemaGroups(connection)
    .map((group) => ({
      ...group,
      items: group.items.filter(({ label }) => matchesSearch(search, label)),
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
            data-mask
            placeholder="Search"
            className="text-sm"
            aria-label="Search definitions"
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
                    className="text-foreground hover:text-foreground data-active:bg-primary data-active:text-primary-foreground hover:data-active:bg-primary hover:data-active:text-primary-foreground h-7 cursor-default gap-2 rounded-md px-2 text-sm"
                    render={
                      <Link
                        to="/connection/$resourceId/$tabId"
                        params={{
                          resourceId: connectionResource.id,
                          tabId,
                        }}
                        preload="viewport"
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
