import { ORPCError } from '@orpc/client'
import { silently } from '@tamery/shared/utils'
import type { OfflineExecutor } from '@tanstack/offline-transactions'
import {
  NonRetriableError,
  startOfflineExecutor,
} from '@tanstack/offline-transactions'
import { getRouteApi } from '@tanstack/react-router'

import { createConnectionStringsCollection } from '~/core/connection/connection-strings'
import {
  createConnectionsCollection,
  createConnectionsResourcesCollection,
} from '~/core/connection/sync'
import { createWorkspacesCollection } from '~/core/workspace/sync'
import {
  createChatsCollection,
  createChatsMessagesCollection,
  createChatsMessagesPartsCollection,
} from '~/modules/chat/sync'
import { createQueriesCollection } from '~/modules/runner/sync'
import { isServerError } from '~/utils/error'

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

let current: { collections: Collections; offline: OfflineExecutor } | null =
  null

const init = () => {
  if (current) {
    return current
  }

  const connectionStringsCollection = createConnectionStringsCollection()

  const collections: Collections = {
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

  current = {
    collections,
    offline: startOfflineExecutor({
      // The spread gives the interface the index signature the executor's type needs.
      collections: { ...collections },
      mutationFns: {
        // Sequential: a connection must land before the resource referencing it.
        push: async ({ transaction }) => {
          for (const mutation of transaction.mutations) {
            const { push } = mutation.collection.utils
            // Local-only collections (connection strings) have no `push`.
            if (!push) {
              throw new NonRetriableError(
                `${mutation.collection.id} cannot be written offline`
              )
            }
            // oxlint-disable-next-line no-await-in-loop
            await push(mutation).catch((error: unknown) => {
              // The executor retries every other error forever.
              if (error instanceof ORPCError && !isServerError(error)) {
                throw new NonRetriableError(error.message)
              }
              throw error
            })
          }
        },
      },
    }),
  }

  return current
}

export const getCollections = (): Collections => init().collections

export const whenOfflineReady = () => init().offline.waitForInit()

export const mutateOffline = (mutate: () => void) => {
  const tx = init().offline.createOfflineTransaction({
    autoCommit: false,
    mutationFnName: 'push',
  })
  const transaction = tx.mutate(mutate)
  // A rollback rejects both promises; the oRPC link has already toasted it.
  silently(() => tx.commit())
  silently(() => transaction.isPersisted.promise)
  return transaction
}

export const cleanCollections = async () => {
  if (!current) {
    return
  }

  const { offline } = current
  current = null
  await offline.clearOutbox()
  offline.dispose()
}

const { useRouteContext } = getRouteApi('/_protected')

export const useCollections = (): Collections => useRouteContext().collections
