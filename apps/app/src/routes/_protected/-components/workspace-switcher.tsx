import { RiAddLine, RiCheckLine, RiExpandUpDownLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { useSubscription } from '~/entities/user/hooks'
import type { Workspace } from '~/entities/workspace'
import { useActiveWorkspace, useWorkspaces } from '~/entities/workspace'
import { authClient } from '~/lib/auth'
import { setIsSubscriptionDialogOpen } from '~/store'

import { CreateWorkspaceDialog } from './create-workspace-dialog'

function WorkspaceGlyph({ workspace }: { workspace: Pick<Workspace, 'name'> }) {
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded bg-accent text-2xs font-medium text-accent-foreground"
    >
      {workspace.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function WorkspaceSwitcher() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: workspaces, refetch } = useWorkspaces()
  const { data: activeWorkspace } = useActiveWorkspace()
  const { subscription } = useSubscription()

  function handleOpenChange(next: boolean) {
    setOpen(next)

    if (next) {
      refetch()
    }
  }

  async function switchWorkspace(id: string) {
    setOpen(false)

    if (id === activeWorkspace?.id) {
      return
    }

    await authClient.organization.setActive({ organizationId: id })
    await navigate({ to: '/' })
  }

  function handleCreate() {
    setOpen(false)

    if (subscription) {
      setCreateOpen(true)
    } else {
      setIsSubscriptionDialogOpen(true)
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
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
            <span className="truncate font-medium text-muted-foreground">Workspace</span>
          )}
          <RiExpandUpDownLine className="size-3 shrink-0 text-muted-foreground/70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[70vh] min-w-56 overflow-auto">
          {workspaces?.map(workspace => (
            <DropdownMenuItem key={workspace.id} onClick={() => switchWorkspace(workspace.id)}>
              <WorkspaceGlyph workspace={workspace} />
              <span data-mask className="truncate">
                {workspace.name}
              </span>
              {workspace.id === activeWorkspace?.id && <RiCheckLine className="ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate}>
            <RiAddLine className="size-4 shrink-0" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
