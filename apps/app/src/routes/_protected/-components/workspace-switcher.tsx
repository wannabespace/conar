import { RiAddLine, RiCheckLine, RiExpandUpDownLine } from '@remixicon/react'
import { CONNECTION_RESOURCE_ROOT_LABEL } from '@tamery/shared/constants'
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
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Link } from '~/components/link'
import { useCollections } from '~/entities/collections'
import type { Connection, ConnectionResource } from '~/entities/connection'
import {
  ConnectionIcon,
  ConnectionResourceLink,
  useConnectionResourceLinkParams,
} from '~/entities/connection'
import { useSubscription } from '~/entities/user/hooks'
import type { Workspace } from '~/entities/workspace'
import { setActiveWorkspace, useActiveWorkspace } from '~/entities/workspace'
import { setIsSubscriptionDialogOpen } from '~/store'

import { CreateWorkspaceDialog } from './create-workspace-dialog'

interface WorkspaceConnection {
  connection: Connection
  resources: ConnectionResource[]
}

const WorkspaceGlyph = ({
  workspace,
}: {
  workspace: Pick<Workspace, 'name'>
}) => (
  <span
    aria-hidden
    data-mask
    className="bg-muted text-2xs text-accent-foreground flex size-4 shrink-0 items-center justify-center rounded font-medium"
  >
    {[...workspace.name][0]?.toUpperCase() ?? ''}
  </span>
)

const useConnectionsByWorkspace = () => {
  const { connectionsCollection, connectionsResourcesCollection } =
    useCollections()
  const { data } = useLiveQuery({
    query: (q) =>
      q
        .from({ c: connectionsCollection })
        .innerJoin({ r: connectionsResourcesCollection }, ({ c, r }) =>
          eq(r.connectionId, c.id)
        )
        .select(({ c, r }) => ({ connection: c, resource: r }))
        .orderBy(({ c }) => c.createdAt, 'desc')
        .orderBy(({ r }) => r.name, 'asc'),
  })

  const byConnection = new Map<string, WorkspaceConnection>()

  for (const { connection, resource } of data) {
    const existing = byConnection.get(connection.id)

    if (existing) {
      existing.resources.push(resource)
    } else {
      byConnection.set(connection.id, { connection, resources: [resource] })
    }
  }

  return Map.groupBy(
    byConnection.values(),
    ({ connection }) => connection.workspaceId
  )
}

const ConnectionSubMenu = ({
  connection,
  resources,
  onSelect,
}: {
  connection: Connection
  resources: ConnectionResource[]
  onSelect: () => void
}) => {
  const navigate = useNavigate()
  const [firstResource] = resources

  if (!firstResource) {
    throw new Error(`Connection ${connection.id} has no resources`)
  }

  const firstResourceLink = useConnectionResourceLinkParams(firstResource.id)

  if (!firstResource) {
    return null
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        onClick={() => {
          onSelect()
          navigate(firstResourceLink)
        }}
      >
        <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
        <span data-mask className="truncate">
          {connection.name}
        </span>
        {connection.color && (
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: connection.color }}
          />
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[60vh] min-w-48 overflow-auto">
        {resources.map((resource) => (
          <DropdownMenuItem
            key={resource.id}
            onClick={onSelect}
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
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

const WorkspaceSubMenu = ({
  workspace,
  connections,
  isActive,
  onSwitch,
  onNavigate,
}: {
  workspace: Workspace
  connections: WorkspaceConnection[]
  isActive: boolean
  onSwitch: () => void
  onNavigate: () => void
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger onClick={onSwitch}>
      <WorkspaceGlyph workspace={workspace} />
      <span data-mask className="truncate">
        {workspace.name}
      </span>
      {isActive && <RiCheckLine className="ml-auto" />}
    </DropdownMenuSubTrigger>
    <DropdownMenuSubContent className="max-h-[60vh] min-w-48 overflow-auto">
      {connections.length === 0 && (
        <div className="text-muted-foreground px-2 py-1.5 text-sm">
          No connections yet
        </div>
      )}
      {connections.map(({ connection, resources }) => (
        <ConnectionSubMenu
          key={connection.id}
          connection={connection}
          resources={resources}
          onSelect={() => {
            setActiveWorkspace(workspace.id)
            onNavigate()
          }}
        />
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          setActiveWorkspace(workspace.id)
          onNavigate()
        }}
        render={<Link to="/create" activateOn="click" />}
      >
        <RiAddLine className="size-4 shrink-0" />
        Add new connection
      </DropdownMenuItem>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
)

export const WorkspaceSwitcher = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: activeWorkspace, workspaces } = useActiveWorkspace()
  const { subscription, isPending: isSubscriptionPending } = useSubscription()
  const connectionsByWorkspace = useConnectionsByWorkspace()

  const switchWorkspace = async (id: string) => {
    setOpen(false)

    if (id === activeWorkspace?.id) {
      return
    }

    setActiveWorkspace(id)
    await navigate({ to: '/' })
  }

  const handleCreate = () => {
    setOpen(false)

    if (subscription || isSubscriptionPending) {
      setCreateOpen(true)
    } else {
      setIsSubscriptionDialogOpen(true)
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label="Switch workspace"
              className="max-w-56 gap-1.5 px-2"
            />
          }
        >
          {activeWorkspace ? (
            <>
              <WorkspaceGlyph workspace={activeWorkspace} />
              <span data-mask className="truncate font-medium">
                {activeWorkspace.name}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground truncate font-medium">
              Workspace
            </span>
          )}
          <RiExpandUpDownLine className="text-muted-foreground/70 size-3 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[70vh] min-w-56 overflow-auto"
        >
          {workspaces.map((workspace) => (
            <WorkspaceSubMenu
              key={workspace.id}
              workspace={workspace}
              connections={connectionsByWorkspace.get(workspace.id) ?? []}
              isActive={workspace.id === activeWorkspace?.id}
              onSwitch={() => switchWorkspace(workspace.id)}
              onNavigate={() => setOpen(false)}
            />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate}>
            <RiAddLine />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
