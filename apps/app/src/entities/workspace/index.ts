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

export function useWorkspaces() {
  return authClient.useListOrganizations()
}

export function useActiveWorkspace() {
  return authClient.useActiveOrganization()
}

function workspaceCreatedAt(workspace: Pick<Workspace, 'createdAt'>) {
  return new Date(workspace.createdAt).getTime()
}

/**
 * When a user has workspaces but none is active (never chose one), pick the oldest
 * — their default workspace — and persist it to the session via `setActive`.
 */
export function useActiveWorkspaceSync() {
  const { data: workspaces, isPending: workspacesPending } = useWorkspaces()
  const { data: activeWorkspace, isPending: activePending } = useActiveWorkspace()
  const settingRef = useRef(false)

  useEffect(() => {
    if (workspacesPending || activePending || activeWorkspace || settingRef.current) {
      return
    }

    const first = workspaces
      ?.toSorted((a, b) => workspaceCreatedAt(a) - workspaceCreatedAt(b))
      .at(0)

    if (!first) {
      return
    }

    settingRef.current = true

    authClient.organization.setActive({ organizationId: first.id }).finally(() => {
      settingRef.current = false
    })
  }, [workspaces, activeWorkspace, workspacesPending, activePending])
}

function workspaceMetadata(workspace: Pick<Workspace, 'metadata'>) {
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

export function isDefaultWorkspace(workspace: Pick<Workspace, 'metadata'>) {
  return workspaceMetadata(workspace)?.default === true
}

export function connectionInWorkspace(
  connectionWorkspaceId: string | null | undefined,
  activeWorkspace: Pick<Workspace, 'id' | 'metadata'> | null | undefined,
) {
  if (!activeWorkspace) {
    return true
  }

  if (!connectionWorkspaceId) {
    return isDefaultWorkspace(activeWorkspace)
  }

  return connectionWorkspaceId === activeWorkspace.id
}
