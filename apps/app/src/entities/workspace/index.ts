import { useEffect, useRef } from 'react'

import { authClient } from '~/lib/auth'

export interface Workspace {
  id: string
  name: string
  slug: string
  logo?: string | null
  metadata?: string | Record<string, unknown> | null
  createdAt: Date | string
}

export const useWorkspaces = () => authClient.useListOrganizations()

export const useActiveWorkspace = () => authClient.useActiveOrganization()

const workspaceCreatedAt = (workspace: Pick<Workspace, 'createdAt'>) =>
  new Date(workspace.createdAt).getTime()

export const useActiveWorkspaceSync = () => {
  const { data: workspaces, isPending: workspacesPending } = useWorkspaces()
  const { data: activeWorkspace, isPending: activePending } =
    useActiveWorkspace()
  const settingRef = useRef(false)

  useEffect(() => {
    if (
      workspacesPending ||
      activePending ||
      activeWorkspace ||
      settingRef.current
    ) {
      return
    }

    const first = workspaces
      ?.toSorted((a, b) => workspaceCreatedAt(a) - workspaceCreatedAt(b))
      .at(0)

    if (!first) {
      return
    }

    settingRef.current = true

    void (async () => {
      try {
        await authClient.organization.setActive({ organizationId: first.id })
      } finally {
        settingRef.current = false
      }
    })()
  }, [workspaces, activeWorkspace, workspacesPending, activePending])
}

const workspaceMetadata = (workspace: Pick<Workspace, 'metadata'>) => {
  if (!workspace.metadata) {
    return null
  }

  if (typeof workspace.metadata === 'string') {
    try {
      return JSON.parse(workspace.metadata) as Record<string, unknown>
    } catch {
      return null
    }
  }

  return workspace.metadata
}

export const isDefaultWorkspace = (workspace: Pick<Workspace, 'metadata'>) =>
  workspaceMetadata(workspace)?.default === true

export const connectionInWorkspace = (
  connectionWorkspaceId: string | null | undefined,
  activeWorkspace: Pick<Workspace, 'id' | 'metadata'> | null | undefined
) => {
  if (!activeWorkspace) {
    return true
  }

  if (!connectionWorkspaceId) {
    return isDefaultWorkspace(activeWorkspace)
  }

  return connectionWorkspaceId === activeWorkspace.id
}
