import type { ConnectionString } from '~/entities/connection/connection-strings'
import type { Connection, ConnectionResource } from '~/entities/connection/sync'
import { createEffect, createOptimisticAction } from '@tanstack/react-db'
import { getRouteApi } from '@tanstack/react-router'
import { clearMemoizeCache, memoize } from 'memoza'
import { createChatCollections } from '~/entities/chat/sync'
import { createConnectionStringsCollection } from '~/entities/connection/connection-strings'
import { createConnectionCollections, prepareConnectionToCloud } from '~/entities/connection/sync'
import { createQueryCollections } from '~/entities/query/sync'
import { orpc } from './orpc'

type ActiveCollections = ReturnType<typeof createConnectionCollections>
  & ReturnType<typeof createChatCollections>
  & ReturnType<typeof createQueryCollections>
  & ReturnType<typeof createConnectionStringsCollection>
  & {
    createConnectionAction: ReturnType<typeof createOptimisticAction<{
      connection: Connection
      resource: ConnectionResource
      connectionString: ConnectionString
    }>>
  }

let activeCollections: ActiveCollections | null = null

function buildCollections(): ActiveCollections {
  const connectionStringsColls = createConnectionStringsCollection()
  const connectionColls = createConnectionCollections({ decrypt: connectionStringsColls.connectionStringsCollection.utils.decrypt })
  const chatColls = createChatCollections()
  const queryColls = createQueryCollections()

  const effect = createEffect<Connection>({
    query: q => q.from({ connections: connectionColls.connectionsCollection }),
    skipInitial: false,
    onEnter: async ({ value }) => {
      const connectionString = await connectionStringsColls.connectionStringsCollection.utils.resolve(value.id)
      if (connectionString) {
        const record = await connectionStringsColls.connectionStringsCollection.utils.prepare({ connectionId: value.id, connectionString, updatedAt: value.updatedAt })

        if (connectionStringsColls.connectionStringsCollection.has(value.id)) {
          connectionStringsColls.connectionStringsCollection.update(value.id, draft => Object.assign(draft, record))
        }
        else {
          connectionStringsColls.connectionStringsCollection.insert(record)
        }
      }
    },
    onExit: async ({ value }) => {
      connectionStringsColls.connectionStringsCollection.delete(value.id)
    },
  })

  connectionColls.connectionsCollection.on('status:cleaned-up', () => {
    effect.dispose()
  })

  const createConnectionAction = createOptimisticAction<{
    connection: Connection
    resource: ConnectionResource
    connectionString: ConnectionString
  }>({
    onMutate: ({ connection, resource, connectionString }) => {
      connectionColls.connectionsCollection.insert(connection)
      connectionColls.connectionsResourcesCollection.insert(resource)
      connectionStringsColls.connectionStringsCollection.insert(connectionString)
    },
    mutationFn: async ({ connection, resource }) => {
      await orpc.connections.create.call(await prepareConnectionToCloud(connection, connectionStringsColls.connectionStringsCollection.utils.decrypt))
      await orpc.connectionsResources.create.call(resource)
    },
  })

  return {
    ...connectionColls,
    ...chatColls,
    ...queryColls,
    ...connectionStringsColls,
    createConnectionAction,
  }
}

export const getCollections = memoize(() => {
  activeCollections = buildCollections()
  return activeCollections
})

export type Collections = ReturnType<typeof getCollections>

export function clearCollections() {
  activeCollections = null
  clearMemoizeCache(getCollections)
}

const protectedApi = getRouteApi('/_protected')

export function useCollections() {
  return protectedApi.useLoaderData({ select: c => c.collections })
}
