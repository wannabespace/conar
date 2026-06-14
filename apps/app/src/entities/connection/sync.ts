import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { BasicIndex, createCollection, createOptimisticAction } from '@tanstack/react-db'
import { type } from 'arktype'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { orpc } from '~/lib/orpc'
import { persistence, shapeOptions } from '~/lib/sync'

export const connectionsSchema = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  type: type.valueOf(ConnectionType),
  name: 'string',
  label: 'string | null',
  color: 'string | null',
  passwordExists: 'boolean',
  syncType: type.valueOf(SyncType),
})

export type Connection = typeof connectionsSchema.infer

function prepareConnectionStringToCloud(connectionString: string, syncType: SyncType) {
  const url = new SafeURL(connectionString.trim())
  if (syncType !== SyncType.Cloud) {
    url.password = ''
  }
  return url.toString()
}

// @ts-expect-error waiting for https://github.com/TanStack/db/pull/1453
export const connectionsCollection = createCollection(persistedCollectionOptions<Connection>({
  ...electricCollectionOptions({
    schema: connectionsSchema,
    id: 'connections',
    shapeOptions: shapeOptions('connections'),
    getKey: item => item.id,
    onInsert: async ({ transaction }) => {
      return orpc.connections.create.call(await Promise.all(transaction.mutations.map(m => connectionToCloudInput(m.modified))))
    },
    onUpdate: async ({ transaction }) => {
      const result = await Promise.all(transaction.mutations.map(m => orpc.connections.update.call({
        id: m.key,
        ...m.changes,
      })))
      return { txid: result.map(r => r.txid) }
    },
    onDelete: async ({ transaction }) => {
      return orpc.connections.remove.call(transaction.mutations.map(m => ({ id: m.key })))
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))

async function connectionToCloudInput(connection: Connection) {
  const connectionString = await connectionStringStorage.decrypt(connection.id)

  return {
    ...connection,
    isPasswordExists: connection.passwordExists,
    connectionString: prepareConnectionStringToCloud(connectionString, connection.syncType),
  }
}

export const connectionsResourcesSchema = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  connectionId: 'string',
  name: 'string | null',
})

export type ConnectionResource = typeof connectionsResourcesSchema.infer

// @ts-expect-error waiting for https://github.com/TanStack/db/pull/1453
export const connectionsResourcesCollection = createCollection(persistedCollectionOptions<ConnectionResource>({
  ...electricCollectionOptions({
    schema: connectionsResourcesSchema,
    id: 'connections-resources',
    shapeOptions: shapeOptions('connections-resources'),
    getKey: item => item.id,
    onInsert: async ({ transaction }) => {
      return orpc.connectionsResources.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      const result = await Promise.all(transaction.mutations
        .map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
      return { txid: result.map(r => r.txid) }
    },
    onDelete: async ({ transaction }) => {
      return orpc.connectionsResources.remove.call(transaction.mutations.map(m => ({ id: m.key })))
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))

export const createConnectionWithResource = createOptimisticAction<{
  connection: Connection
  resource: ConnectionResource
}>({
  onMutate: ({ connection, resource }) => {
    connectionsCollection.insert(connection)
    connectionsResourcesCollection.insert(resource)
  },
  mutationFn: async ({ connection, resource }) => {
    const { txid: connectionTxid } = await orpc.connections.create.call(await connectionToCloudInput(connection))
    const { txid: resourceTxid } = await orpc.connectionsResources.create.call(resource)

    await Promise.all([
      connectionsCollection.utils.awaitTxId(connectionTxid),
      connectionsResourcesCollection.utils.awaitTxId(resourceTxid),
    ])
  },
})
