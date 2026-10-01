import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
import { openTab } from '~/core/tabs/actions'
import { appModules } from '~/lib/modules'

import {
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './primitives'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const DefinitionsPanel = () => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const [search, setSearch] = useState('')

  const filtered = appModules
    .schemaGroups(connection.type)
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
            <SidebarGroupLabel className="text-muted-foreground font-row h-6 px-2 text-xs">
              {group.label}
            </SidebarGroupLabel>
            {group.items.map(({ icon, label, tabId }) => {
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
                        onClick={() =>
                          openTab(connectionResource.id, tabId, true)
                        }
                        onDoubleClick={() =>
                          openTab(connectionResource.id, tabId)
                        }
                      />
                    }
                  >
                    <HugeiconsIcon
                      icon={icon}
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
