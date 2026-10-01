import { getRouteApi } from '@tanstack/react-router'

import { createConnectionStringsCollection } from '~/core/connection/connection-strings'
import {
  createConnectionsCollection,
  createConnectionsResourcesCollection,
} from '~/core/connection/sync'
import { createWorkspacesCollection } from '~/core/workspace/sync'

// Modules add their collections by augmenting this interface in `collections.ts`.
export interface Collections {
  connectionsCollection: ReturnType<typeof createConnectionsCollection>
  connectionsResourcesCollection: ReturnType<
    typeof createConnectionsResourcesCollection
  >
  connectionStringsCollection: ReturnType<
    typeof createConnectionStringsCollection
  >
  workspacesCollection: ReturnType<typeof createWorkspacesCollection>
}

const moduleCollections = Object.values(
  import.meta.glob<() => Partial<Collections>>(
    '/src/modules/*/collections.ts',
    { eager: true, import: 'default' }
  )
)

let current: Collections | null = null
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) {
    listener()
  }
}

export const getCollections = (): Collections => {
  if (current) {
    return current
  }

  const connectionStringsCollection = createConnectionStringsCollection()

  current = {
    // Each module's factory fills exactly the keys its augmentation declares.
    ...(Object.assign(
      {},
      ...moduleCollections.map((create) => create())
    ) as Collections),
    connectionStringsCollection,
    connectionsCollection: createConnectionsCollection(
      connectionStringsCollection
    ),
    connectionsResourcesCollection: createConnectionsResourcesCollection(),
    workspacesCollection: createWorkspacesCollection(),
  }

  notify()
  return current
}

export const cleanCollections = () => {
  if (!current) {
    return
  }

  current = null
  notify()
}

const { useRouteContext } = getRouteApi('/_protected')

export const useCollections = (): Collections => useRouteContext().collections
