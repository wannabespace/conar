import { isDefaultWorkspaceMetadata } from '@tamery/shared/workspace'
import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import type { Workspace } from './sync'

export const activeWorkspaceIdStorageValue = createWebStorageValue({
  defaultValue: null,
  key: 'tamery.active-workspace-id',
  schema: type('string | null'),
  type: 'localStorage',
})

export const setActiveWorkspace = (workspaceId: string) => {
  activeWorkspaceIdStorageValue.set(workspaceId)
}

export const resolveActiveWorkspace = (
  workspaces: Workspace[],
  activeId: string | null
) =>
  workspaces.find((workspace) => workspace.id === activeId) ??
  workspaces.at(0) ??
  null

export const getActiveWorkspace = (workspaces: Workspace[]) =>
  resolveActiveWorkspace(workspaces, activeWorkspaceIdStorageValue.get())

export const isDefaultWorkspace = (workspace: Pick<Workspace, 'metadata'>) =>
  isDefaultWorkspaceMetadata(workspace.metadata)

export const connectionInWorkspace = (
  connectionWorkspaceId: string,
  activeWorkspace: Pick<Workspace, 'id'> | null | undefined
) => !activeWorkspace || connectionWorkspaceId === activeWorkspace.id
