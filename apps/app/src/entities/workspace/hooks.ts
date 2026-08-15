import { useLiveQuery } from '@tanstack/react-db'
import { useCallback } from 'react'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/entities/collections'

import {
  activeWorkspaceIdStorageValue,
  isDefaultWorkspace,
  resolveActiveWorkspace,
} from './utils'

export const useActiveWorkspace = () => {
  const { workspacesCollection } = useCollections()

  const { data: workspaces } = useLiveQuery(
    (q) => q.from({ w: workspacesCollection }),
    [workspacesCollection]
  )
  const activeId = useSubscription(activeWorkspaceIdStorageValue)

  return { data: resolveActiveWorkspace(workspaces, activeId), workspaces }
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
