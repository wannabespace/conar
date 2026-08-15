import { isDefaultWorkspaceMetadata } from '@tamery/shared/workspace'
import { useLiveQuery } from '@tanstack/react-db'
import { type } from 'arktype'
import { useCallback } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { useCollections } from '~/entities/collections'

import type { Workspace } from './sync'

export type { Workspace } from './sync'
export { createWorkspacesCollection } from './sync'

const activeWorkspaceIdStorageValue = createWebStorageValue({
  defaultValue: null,
  key: 'tamery.active-workspace-id',
  schema: type('string | null'),
  type: 'localStorage',
})

export const useWorkspaces = () => {
  const { workspacesCollection } = useCollections()

  return useLiveQuery(
    (q) =>
      q
        .from({ w: workspacesCollection })
        .orderBy(({ w }) => w.createdAt, 'asc'),
    [workspacesCollection]
  )
}

const resolveActiveWorkspace = (
  workspaces: Workspace[],
  activeId: string | null
) =>
  workspaces.find((workspace) => workspace.id === activeId) ??
  workspaces.at(0) ??
  null

export const useActiveWorkspace = () => {
  const { data: workspaces } = useWorkspaces()
  const activeId = useSubscription(activeWorkspaceIdStorageValue)

  return { data: resolveActiveWorkspace(workspaces, activeId), workspaces }
}

export const getActiveWorkspace = (workspaces: Workspace[]) =>
  resolveActiveWorkspace(workspaces, activeWorkspaceIdStorageValue.get())

export const setActiveWorkspace = (workspaceId: string) => {
  activeWorkspaceIdStorageValue.set(workspaceId)
}

export const isDefaultWorkspace = (workspace: Pick<Workspace, 'metadata'>) =>
  isDefaultWorkspaceMetadata(workspace.metadata)

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

export const useConnectionWorkspaceFilter = () => {
  const { data: activeWorkspace } = useActiveWorkspace()
  const activeWorkspaceId = activeWorkspace?.id ?? null
  const isDefault = activeWorkspace ? isDefaultWorkspace(activeWorkspace) : true

  return useCallback(
    (connectionWorkspaceId: string | null | undefined) => {
      if (!activeWorkspaceId) {
        return true
      }

      return connectionWorkspaceId
        ? connectionWorkspaceId === activeWorkspaceId
        : isDefault
    },
    [activeWorkspaceId, isDefault]
  )
}
