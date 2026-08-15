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
import {
  setActiveWorkspace,
  useActiveWorkspace,
  useWorkspaces,
} from '~/entities/workspace'
import { setIsSubscriptionDialogOpen } from '~/store'

import { CreateWorkspaceDialog } from './create-workspace-dialog'

const WorkspaceGlyph = ({
  workspace,
}: {
  workspace: Pick<Workspace, 'name'>
}) => (
  <span
    aria-hidden
    data-mask
    className="bg-accent text-2xs text-accent-foreground flex size-4 shrink-0 items-center justify-center rounded font-medium"
  >
    {workspace.name.charAt(0).toUpperCase()}
  </span>
)

export const WorkspaceSwitcher = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: workspaces } = useWorkspaces()
  const { data: activeWorkspace } = useActiveWorkspace()
  const { subscription } = useSubscription()

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

    if (subscription) {
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
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace.id)}
            >
              <WorkspaceGlyph workspace={workspace} />
              <span data-mask className="truncate">
                {workspace.name}
              </span>
              {workspace.id === activeWorkspace?.id && (
                <RiCheckLine className="ml-auto" />
              )}
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
