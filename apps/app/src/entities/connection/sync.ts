import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { type } from 'arktype'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { shapeOptions } from '~/lib/electric'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

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

async function prepareConnectionStringToCloud(connectionString: string, syncType: SyncType) {
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
    onInsert: async ({ transaction, collection }) => {
      const result = await orpc.connections.create.call(await Promise.all(transaction.mutations.map(async (m) => {
        const connectionString = await connectionStringStorage.decrypt(m.modified.id)

        return {
          ...m.modified,
          isPasswordExists: m.modified.passwordExists,
          connectionString: await prepareConnectionStringToCloud(connectionString, m.modified.syncType),
        }
      })))
      await collection.utils.awaitTxId(result.txid)
    },
    onUpdate: async ({ transaction, collection }) => {
      const result = await Promise.all(transaction.mutations.map(m => orpc.connections.update.call({
        id: m.key,
        ...m.changes,
      })))
      await Promise.all(result.map(r => collection.utils.awaitTxId(r.txid)))
    },
    onDelete: async ({ transaction, collection }) => {
      const result = await orpc.connections.remove.call(transaction.mutations.map(m => ({ id: m.key })))
      await collection.utils.awaitTxId(result.txid)
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))

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
    onInsert: async ({ transaction, collection }) => {
      const result = await orpc.connectionsResources.create.call(transaction.mutations.map(m => m.modified))
      await collection.utils.awaitTxId(result.txid)
    },
    onUpdate: async ({ transaction, collection }) => {
      const result = await Promise.all(transaction.mutations.map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
      await Promise.all(result.map(r => collection.utils.awaitTxId(r.txid)))
    },
    onDelete: async ({ transaction, collection }) => {
      const result = await orpc.connectionsResources.remove.call(transaction.mutations.map(m => ({ id: m.key })))
      await collection.utils.awaitTxId(result.txid)
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))
