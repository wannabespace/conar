import { getRouteApi } from '@tanstack/react-router'

import {
  createChatsCollection,
  createChatsMessagesCollection,
} from '~/entities/chat/sync'
import {
  createConnectionsCollection,
  createConnectionsResourcesCollection,
  createConnectionStringsCollection,
} from '~/entities/connection/core'
import { createQueriesCollection } from '~/entities/query/sync'

export interface Collections {
  connectionsCollection: ReturnType<typeof createConnectionsCollection>
  connectionsResourcesCollection: ReturnType<
    typeof createConnectionsResourcesCollection
  >
  connectionStringsCollection: ReturnType<
    typeof createConnectionStringsCollection
  >
  chatsCollection: ReturnType<typeof createChatsCollection>
  chatsMessagesCollection: ReturnType<typeof createChatsMessagesCollection>
  queriesCollection: ReturnType<typeof createQueriesCollection>
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
    chatsCollection: createChatsCollection(),
    chatsMessagesCollection: createChatsMessagesCollection(),
    connectionStringsCollection: createConnectionStringsCollection(),
    connectionsCollection: createConnectionsCollection(),
    connectionsResourcesCollection: createConnectionsResourcesCollection(),
    queriesCollection: createQueriesCollection(),
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
