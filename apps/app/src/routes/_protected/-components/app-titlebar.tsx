import { RiAddLine, RiArrowDownSLine, RiCommandLine, RiDeleteBinLine } from '@remixicon/react'
import { CONNECTION_RESOURCE_ROOT_LABEL } from '@tamery/shared/constants'
import { getOS } from '@tamery/shared/utils/os'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { useRef, useState } from 'react'

import { TitleBar } from '~/components/title-bar'
import { UpdateButton } from '~/components/update-button'
import { useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection'
import {
  ConnectionIcon,
  ConnectionResourceLink,
  useConnectionResourceLinkParams,
} from '~/entities/connection'
import { UserButton } from '~/entities/user/components'
import { setIsActionCenterOpen } from '~/store'

import { RemoveConnectionDialog } from './remove-connection-dialog'

const os = getOS(navigator.userAgent)

interface ConnectionGroup {
  connection: Connection
  resources: ConnectionResource[]
}

function ConnectionSubMenu({
  group: { connection, resources },
  firstResource,
  onRemove,
  onNavigate,
}: {
  group: ConnectionGroup
  firstResource: ConnectionResource
  onRemove: (connection: Connection) => void
  onNavigate: () => void
}) {
  const navigate = useNavigate()
  const firstResourceLink = useConnectionResourceLinkParams(firstResource.id)

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        onClick={() => {
          onNavigate()
          navigate(firstResourceLink)
        }}
      >
        <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
        <span className="truncate">{connection.name}</span>
        {connection.color && (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: connection.color }}
          />
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[60vh] min-w-48 overflow-auto">
        {resources.map(resource => (
          <DropdownMenuItem
            key={resource.id}
            render={<ConnectionResourceLink resourceId={resource.id} />}
          >
            <span className="truncate">{resource.name || CONNECTION_RESOURCE_ROOT_LABEL}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onRemove(connection)}>
          <RiDeleteBinLine className="size-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function ConnectionsDropdown({
  groups,
  current,
  onRemove,
}: {
  groups: ConnectionGroup[]
  current: Connection | undefined
  onRemove: (connection: Connection) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="max-w-64" />}>
        {current ? (
          <>
            <ConnectionIcon type={current.type} className="size-4 shrink-0" />
            <span className="truncate">{current.name}</span>
            {current.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: current.color }}
              />
            )}
          </>
        ) : (
          <span className="truncate">Connections</span>
        )}
        <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] min-w-64 overflow-auto">
        {groups.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No connections yet</div>
        )}
        {groups.map(group => {
          const firstResource = group.resources[0]
          if (!firstResource) return null
          return (
            <ConnectionSubMenu
              key={group.connection.id}
              group={group}
              firstResource={firstResource}
              onRemove={onRemove}
              onNavigate={() => setOpen(false)}
            />
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/create" />}>
          <RiAddLine className="size-4 shrink-0" />
          Add new connection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ResourcesDropdown({
  resources,
  current,
}: {
  resources: ConnectionResource[]
  current: ConnectionResource
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="max-w-64" />}>
        <span className="truncate">{current.name || CONNECTION_RESOURCE_ROOT_LABEL}</span>
        <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] min-w-48 overflow-auto">
        {resources.map(resource => (
          <DropdownMenuItem
            key={resource.id}
            render={<ConnectionResourceLink resourceId={resource.id} />}
          >
            <span className="truncate">{resource.name || CONNECTION_RESOURCE_ROOT_LABEL}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConnectionsBreadcrumb({ onRemove }: { onRemove: (connection: Connection) => void }) {
  const { connectionsCollection, connectionsResourcesCollection } = useCollections()
  const { resourceId } = useParams({ strict: false })
  const { data } = useLiveQuery(
    q =>
      q
        .from({ c: connectionsCollection })
        .innerJoin({ r: connectionsResourcesCollection }, ({ c, r }) => eq(r.connectionId, c.id))
        .select(({ c, r }) => ({ connection: c, resource: r }))
        .orderBy(({ c }) => c.createdAt, 'desc'),
    [connectionsCollection, connectionsResourcesCollection],
  )

  const groups: ConnectionGroup[] = []
  const groupById = new Map<string, ConnectionGroup>()
  for (const { connection, resource } of data) {
    let group = groupById.get(connection.id)
    if (!group) {
      group = { connection, resources: [] }
      groupById.set(connection.id, group)
      groups.push(group)
    }
    group.resources.push(resource)
  }
  for (const group of groups) {
    group.resources.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  const current = data.find(({ resource }) => resource.id === resourceId)
  const currentGroup =
    current && groups.find(group => group.connection.id === current.connection.id)

  return (
    <>
      <ConnectionsDropdown groups={groups} current={current?.connection} onRemove={onRemove} />
      {current && currentGroup && (
        <>
          <span className="truncate text-muted-foreground/50">/</span>
          <ResourcesDropdown resources={currentGroup.resources} current={current.resource} />
        </>
      )}
    </>
  )
}

export function AppTitleBar() {
  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)

  return (
    <div className="flex shrink-0 flex-col">
      <TitleBar className="gap-1.5 border-b-border bg-card px-2">
        <RemoveConnectionDialog ref={removeDialogRef} />
        <Link
          to="/"
          aria-label="Home"
          className={`
            shrink-0 rounded-md p-1.5 transition-colors
            hover:bg-muted
          `}
        >
          <AppLogo className="size-4 text-primary" />
        </Link>
        <span className="truncate text-muted-foreground/40">/</span>
        <ConnectionsBreadcrumb
          onRemove={connection => removeDialogRef.current?.remove(connection)}
        />
        <div className="ml-auto flex h-full shrink-0 items-center gap-1">
          <UpdateButton />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Command palette"
                  onClick={() => setIsActionCenterOpen(true)}
                />
              }
            >
              <RiCommandLine className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">{os?.type === 'macos' ? '⌘' : 'Ctrl'}P</TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px shrink-0 self-center bg-border" />
          <UserButton side="bottom" align="end" />
        </div>
      </TitleBar>
    </div>
  )
}
