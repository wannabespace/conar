import { createTransaction } from '@tanstack/react-db'

import { getCollections } from '~/entities/collections'
import { orpc } from '~/lib/orpc'

import type { ConnectionString } from './connection-strings'
import type { Connection, ConnectionResource } from './sync'
import { prepareConnectionToCloud } from './sync'

export const createConnectionTransaction = (data: {
  connection: Connection
  resource: ConnectionResource
  connectionString: ConnectionString
}) => {
  const {
    connectionsCollection,
    connectionsResourcesCollection,
    connectionStringsCollection,
  } = getCollections()

  const tx = createTransaction({
    mutationFn: async () => {
      await orpc.connections.create.call(
        await prepareConnectionToCloud(
          connectionStringsCollection,
          data.connection
        )
      )
      await orpc.connectionsResources.create.call(data.resource)

      if (!window.electron) {
        await Promise.all([
          connectionsCollection.utils.awaitChange(
            data.connection.id,
            data.connection.updatedAt
          ),
          connectionsResourcesCollection.utils.awaitChange(
            data.resource.id,
            data.resource.updatedAt
          ),
        ])
      }
    },
  })

  tx.mutate(() => {
    connectionStringsCollection.insert(data.connectionString)
    connectionsCollection.insert(data.connection)
    connectionsResourcesCollection.insert(data.resource)
  })

  return tx
}
