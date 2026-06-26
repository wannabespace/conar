import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ConnectionString } from './connection-strings'
import type { BaseTable, SyncUtils } from '~/lib/sync'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection, createTransaction } from '@tanstack/react-db'
import { orpc } from '~/lib/orpc'
import { persistence, syncCollectionOptions } from '~/lib/sync'
import { getCollections } from './collections'

function prepareConnectionStringToCloud(connectionString: string, syncType: SyncType) {
  const url = new SafeURL(connectionString.trim())
  if (syncType !== SyncType.Cloud) {
    url.password = ''
  }
  return url.toString()
}

export interface Connection extends BaseTable {
  type: ConnectionType
  name: string
  label: string | null
  color: string | null
  isPasswordExists: boolean
  syncType: SyncType
}

export async function prepareConnectionToCloud(connection: Connection) {
  const { connectionStringsCollection } = getCollections()
  const connectionString = await connectionStringsCollection.utils.decrypt(connection.id)

  return {
    ...connection,
    isPasswordExists: connection.isPasswordExists,
    connectionString: prepareConnectionStringToCloud(connectionString, connection.syncType),
  }
}

export interface ConnectionResource extends BaseTable {
  connectionId: string
  name: string | null
}

export function createConnectionsCollection() {
  return createCollection(persistedCollectionOptions<Connection, string, never, SyncUtils>({
    ...syncCollectionOptions<Connection>({
      id: 'connections',
      getKey: item => item.id,
      events: ({ signal }) => orpc.connections.events.call({}, { signal }),
      sync: ({ rows, signal }) => orpc.connections.sync.call(rows, { signal }),
      onInsert: async ({ transaction }) => {
        await orpc.connections.create.call(
          await Promise.all(transaction.mutations.map(m => prepareConnectionToCloud(m.modified))),
        )
      },
      onUpdate: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map(m => orpc.connections.update.call({
          id: m.key,
          ...m.changes,
        })))
      },
      onDelete: async ({ transaction }) => {
        await orpc.connections.remove.call(transaction.mutations.map(m => ({ id: m.key })))
      },
    }),
    persistence,
    schemaVersion: 1,
  }))
}

export function createConnectionsResourcesCollection() {
  return createCollection(persistedCollectionOptions<ConnectionResource, string, never, SyncUtils>({
    ...syncCollectionOptions<ConnectionResource>({
      id: 'connections-resources',
      getKey: item => item.id,
      events: ({ signal }) => orpc.connectionsResources.events.call({}, { signal }),
      sync: ({ rows, signal }) => orpc.connectionsResources.sync.call(rows, { signal }),
      onInsert: async ({ transaction }) => {
        await orpc.connectionsResources.create.call(transaction.mutations.map(m => m.modified))
      },
      onUpdate: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
      },
      onDelete: async ({ transaction }) => {
        await orpc.connectionsResources.remove.call(transaction.mutations.map(m => ({ id: m.key })))
      },
    }),
    persistence,
    schemaVersion: 1,
  }))
}

export function createConnectionTransaction(data: {
  connection: Connection
  resource: ConnectionResource
  connectionString: ConnectionString
}) {
  const { connectionsCollection, connectionsResourcesCollection, connectionStringsCollection } = getCollections()

  const tx = createTransaction({
    mutationFn: async () => {
      await orpc.connections.create.call(await prepareConnectionToCloud(data.connection))
      await orpc.connectionsResources.create.call(data.resource)

      if (!window.electron) {
        await Promise.all([
          connectionsCollection.utils.awaitChange(data.connection.id, data.connection.updatedAt),
          connectionsResourcesCollection.utils.awaitChange(data.resource.id, data.resource.updatedAt),
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
