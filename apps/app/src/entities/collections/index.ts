import { getRouteApi } from '@tanstack/react-router'

import {
  createConnectionsCollection,
  createConnectionsResourcesCollection,
  createConnectionStringsCollection,
} from '~/entities/connection/core'
import { createQueriesCollection } from '~/entities/query/sync'
import { createWorkspacesCollection } from '~/entities/workspace/sync'

export interface Collections {
  connectionsCollection: ReturnType<typeof createConnectionsCollection>
  connectionsResourcesCollection: ReturnType<
    typeof createConnectionsResourcesCollection
  >
  connectionStringsCollection: ReturnType<
    typeof createConnectionStringsCollection
  >
  queriesCollection: ReturnType<typeof createQueriesCollection>
  workspacesCollection: ReturnType<typeof createWorkspacesCollection>
}

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

  current = {
    connectionStringsCollection: createConnectionStringsCollection(),
    connectionsCollection: createConnectionsCollection(),
    connectionsResourcesCollection: createConnectionsResourcesCollection(),
    queriesCollection: createQueriesCollection(),
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
