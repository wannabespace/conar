import { getRouteApi } from '@tanstack/react-router'
import { createChatsCollection, createChatsMessagesCollection } from '~/entities/chat/sync'
import { createQueriesCollection } from '~/entities/query/sync'
import { createConnectionStringsCollection } from './connection-strings'
import { createConnectionsCollection, createConnectionsResourcesCollection } from './sync'

export interface Collections {
  connectionsCollection: ReturnType<typeof createConnectionsCollection>
  connectionsResourcesCollection: ReturnType<typeof createConnectionsResourcesCollection>
  connectionStringsCollection: ReturnType<typeof createConnectionStringsCollection>
  chatsCollection: ReturnType<typeof createChatsCollection>
  chatsMessagesCollection: ReturnType<typeof createChatsMessagesCollection>
  queriesCollection: ReturnType<typeof createQueriesCollection>
}

let current: Collections | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

export function getCollections(): Collections {
  if (current) {
    return current
  }

  current = {
    connectionsCollection: createConnectionsCollection(),
    connectionsResourcesCollection: createConnectionsResourcesCollection(),
    connectionStringsCollection: createConnectionStringsCollection(),
    chatsCollection: createChatsCollection(),
    chatsMessagesCollection: createChatsMessagesCollection(),
    queriesCollection: createQueriesCollection(),
  }

  notify()
  return current
}

export function cleanCollections() {
  if (!current)
    return

  current = null
  notify()
}

const { useRouteContext } = getRouteApi('/_protected')

export function useCollections(): Collections {
  return useRouteContext().collections
}
