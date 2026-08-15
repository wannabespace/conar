import { useLiveQuery } from '@tanstack/react-db'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/entities/collections'

import { activeWorkspaceIdStorageValue, resolveActiveWorkspace } from './utils'

export const useActiveWorkspace = () => {
  const { workspacesCollection } = useCollections()

  const { data: workspaces } = useLiveQuery(
    (q) => q.from({ w: workspacesCollection }),
    [workspacesCollection]
  )
  const activeId = useSubscription(activeWorkspaceIdStorageValue)

  return { data: resolveActiveWorkspace(workspaces, activeId), workspaces }
}
