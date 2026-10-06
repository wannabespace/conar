import {
  ArrowRight01Icon,
  Delete02Icon,
  PlusSignIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { CONNECTION_RESOURCE_ROOT_LABEL } from '@tamery/shared/constants'
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
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useNavigate, useParams } from '@tanstack/react-router'
import type { CSSProperties, ComponentRef } from 'react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { Link } from '~/components/link'
import { TitleBar } from '~/components/title-bar'
import { useCollections } from '~/core/collections'
import { ConnectionIcon } from '~/core/connection/connection-icon'
import { ConnectionResourceLink } from '~/core/connection/connection-resource-link'
import { lastOpenedResourcesStorageValue } from '~/core/connection/last-opened-resources'
import type { Connection, ConnectionResource } from '~/core/connection/sync'
import { useConnectionResourceLinkParams } from '~/core/connection/use-connection-resource-link-params'
import { checkOrUpgrade, usePermissions } from '~/core/user/permissions'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { protectedModules } from '~/lib/protected-modules'

import { RemoveConnectionDialog } from './remove-connection-dialog'
import { WorkspaceSwitcher } from './workspace-switcher'

interface ConnectionGroup {
  connection: Connection
  resources: ConnectionResource[]
}

const CurrentTick = ({ className }: { className?: string }) => (
  <HugeiconsIcon
    icon={Tick02Icon}
    strokeWidth={2}
    aria-label="Current"
    className={cn('text-muted-foreground size-3.5 shrink-0', className)}
  />
)

const ConnectionSubMenu = ({
  group: { connection, resources },
  lastResource,
  currentResourceId,
  onRemove,
  onNavigate,
}: {
  group: ConnectionGroup
  lastResource: ConnectionResource
  currentResourceId: string | undefined
  onRemove: (connection: Connection) => void
  onNavigate: () => void
}) => {
  const navigate = useNavigate()
  const lastResourceLink = useConnectionResourceLinkParams(lastResource.id)

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        onClick={() => {
          onNavigate()
          navigate(lastResourceLink)
        }}
      >
        <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
        <span data-mask className="truncate">
          {connection.name}
        </span>
        {connection.color && (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-(--color)"
            style={{ '--color': connection.color } as CSSProperties}
          />
        )}
        {resources.some((resource) => resource.id === currentResourceId) && (
          <CurrentTick className="-ml-0.5" />
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[60vh] min-w-48 overflow-auto">
        {resources.map((resource) => (
          <DropdownMenuItem
            key={resource.id}
            render={
              <ConnectionResourceLink
                resourceId={resource.id}
                activateOn="click"
              />
            }
          >
            <span data-mask className="truncate">
              {resource.name || CONNECTION_RESOURCE_ROOT_LABEL}
            </span>
            {resource.id === currentResourceId && (
              <CurrentTick className="ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onRemove(connection)}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
            className="size-4"
          />
          Remove
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

const ConnectionsDropdown = ({
  groups,
  current,
  currentResourceId,
  onRemove,
}: {
  groups: ConnectionGroup[]
  current: Connection | undefined
  currentResourceId: string | undefined
  onRemove: (connection: Connection) => void
}) => {
  const [open, setOpen] = useState(false)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)
  const atGuestLimit = !usePermissions().check('connection.create', {
    count: groups.length,
  })

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            // oxlint-disable-next-line shadcn/no-restyle -- title-bar pickers sit tighter than a toolbar button
            className="max-w-64 gap-1.5 px-2"
          />
        }
      >
        {current ? (
          <>
            <ConnectionIcon type={current.type} className="size-4 shrink-0" />
            <span data-mask className="truncate">
              {current.name}
            </span>
            {current.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-(--color)"
                style={{ '--color': current.color } as CSSProperties}
              />
            )}
          </>
        ) : (
          <span className="truncate">Connections</span>
        )}
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          strokeWidth={2}
          className="text-muted-foreground/70 size-3 shrink-0"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[70vh] min-w-64 overflow-auto"
      >
        {groups.length === 0 && (
          <div className="text-muted-foreground px-2 py-1.5 text-sm">
            No connections yet
          </div>
        )}
        {groups.map((group) => {
          const lastOpenedId = lastOpenedResources.find((id) =>
            group.resources.some((resource) => resource.id === id)
          )
          const lastResource =
            group.resources.find((resource) => resource.id === lastOpenedId) ??
            group.resources[0]
          if (!lastResource) {
            return null
          }
          return (
            <ConnectionSubMenu
              key={group.connection.id}
              group={group}
              lastResource={lastResource}
              currentResourceId={currentResourceId}
              onRemove={onRemove}
              onNavigate={() => setOpen(false)}
            />
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={atGuestLimit ? 'opacity-50' : undefined}
          render={
            <Link to="/create" activateOn="click" disabled={atGuestLimit} />
          }
          onClick={() =>
            checkOrUpgrade('connection.create', { count: groups.length })
          }
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="size-4 shrink-0"
          />
          Add new connection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ResourcesDropdown = ({
  resources,
  current,
}: {
  resources: ConnectionResource[]
  current: ConnectionResource
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          size="sm"
          // oxlint-disable-next-line shadcn/no-restyle -- title-bar pickers sit tighter than a toolbar button
          className="max-w-64 gap-1.5 px-2"
        />
      }
    >
      <span data-mask className="text-muted-foreground truncate">
        {current.name || CONNECTION_RESOURCE_ROOT_LABEL}
      </span>
      <HugeiconsIcon
        icon={UnfoldMoreIcon}
        strokeWidth={2}
        className="text-muted-foreground/70 size-3 shrink-0"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className="max-h-[70vh] min-w-48 overflow-auto"
    >
      {resources.map((resource) => (
        <DropdownMenuItem
          key={resource.id}
          render={
            <ConnectionResourceLink
              resourceId={resource.id}
              activateOn="click"
            />
          }
        >
          <span data-mask className="truncate">
            {resource.name || CONNECTION_RESOURCE_ROOT_LABEL}
          </span>
          {resource.id === current.id && <CurrentTick className="ml-auto" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

const ConnectionsBreadcrumb = ({
  onRemove,
}: {
  onRemove: (connection: Connection) => void
}) => {
  const { connectionsCollection, connectionsResourcesCollection } =
    useCollections()
  const { resourceId } = useParams({ strict: false })
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data } = useLiveQuery({
    query: (q) => {
      const query = activeWorkspace
        ? q
            .from({ c: connectionsCollection })
            .where(({ c }) => eq(c.workspaceId, activeWorkspace.id))
        : q.from({ c: connectionsCollection })

      return query
        .innerJoin({ r: connectionsResourcesCollection }, ({ c, r }) =>
          eq(r.connectionId, c.id)
        )
        .select(({ c, r }) => ({ connection: c, resource: r }))
        .orderBy(({ c }) => c.createdAt, 'desc')
    },
  })

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
    current &&
    groups.find((group) => group.connection.id === current.connection.id)

  return (
    <>
      <ConnectionsDropdown
        groups={groups}
        current={current?.connection}
        currentResourceId={resourceId}
        onRemove={onRemove}
      />
      {current && currentGroup && (
        <>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            aria-hidden
            className="text-muted-foreground/40 size-3.5 shrink-0"
          />
          <ResourcesDropdown
            resources={currentGroup.resources}
            current={current.resource}
          />
        </>
      )}
    </>
  )
}

export const ProtectedTitleBar = () => {
  const removeDialogRef =
    useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)

  return (
    <div className="flex shrink-0 flex-col">
      <TitleBar className="border-b-border bg-card gap-1.5">
        <div className="flex w-full items-center px-2">
          <RemoveConnectionDialog ref={removeDialogRef} />
          <Link
            to="/"
            aria-label="Home"
            className="hover:bg-foreground/5 shrink-0 rounded-md p-1.5 transition-colors"
          >
            <AppLogo className="text-primary size-4" />
          </Link>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            aria-hidden
            className="text-muted-foreground/40 size-3.5 shrink-0"
          />
          <WorkspaceSwitcher />
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            aria-hidden
            className="text-muted-foreground/40 size-3.5 shrink-0"
          />
          <ConnectionsBreadcrumb
            onRemove={(connection) =>
              removeDialogRef.current?.remove(connection)
            }
          />
          <div className="ml-auto flex h-full shrink-0 items-center gap-1">
            {protectedModules.titlebar.map(({ Component }, index) => (
              <Component key={index} />
            ))}
          </div>
        </div>
      </TitleBar>
    </div>
  )
}
