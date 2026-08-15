import { useLiveQuery } from '@tanstack/react-db'
import { type } from 'arktype'
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

export const useActiveWorkspace = () => {
  const { data: workspaces } = useWorkspaces()
  const activeId = useSubscription(activeWorkspaceIdStorageValue)

  const data =
    workspaces.find((workspace) => workspace.id === activeId) ??
    workspaces.at(0) ??
    null

  return { data }
}

export const setActiveWorkspace = (workspaceId: string) => {
  activeWorkspaceIdStorageValue.set(workspaceId)
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
