import { getRouteApi } from '@tanstack/react-router'

import {
  createChatsCollection,
  createChatsMessagesCollection,
  createChatsMessagesPartsCollection,
} from '~/entities/chat/sync'
import { createConnectionStringsCollection } from '~/entities/connection/core/connection-strings'
import {
  createConnectionsCollection,
  createConnectionsResourcesCollection,
} from '~/entities/connection/core/sync'
import { createQueriesCollection } from '~/entities/query/sync'
import { createWorkspacesCollection } from '~/entities/workspace/sync'

export interface Collections {
  chatsCollection: ReturnType<typeof createChatsCollection>
  chatsMessagesCollection: ReturnType<typeof createChatsMessagesCollection>
  chatsMessagesPartsCollection: ReturnType<
    typeof createChatsMessagesPartsCollection
  >
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

  const connectionStringsCollection = createConnectionStringsCollection()

  current = {
    chatsCollection: createChatsCollection(),
    chatsMessagesCollection: createChatsMessagesCollection(),
    chatsMessagesPartsCollection: createChatsMessagesPartsCollection(),
    connectionStringsCollection,
    connectionsCollection: createConnectionsCollection(
      connectionStringsCollection
    ),
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
