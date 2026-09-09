import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { persistence } from '~/lib/database'
import { orpc } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { PERSISTED_SCHEMA_VERSION, syncCollectionOptions } from '~/lib/sync'

import type { ConnectionStringsCollection } from './connection-strings'

const prepareConnectionStringToCloud = (
  connectionString: string,
  syncType: SyncType
) => {
  const url = new SafeURL(connectionString.trim())
  if (syncType !== SyncType.Cloud) {
    url.password = ''
  }
  return url.toString()
}

export interface Connection extends BaseTable {
  type: ConnectionType
  workspaceId: string
  name: string
  label: string | null
  color: string | null
  isPasswordExists: boolean
  syncType: SyncType
}

export const prepareConnectionToCloud = async (
  connectionStrings: ConnectionStringsCollection,
  connection: Connection
) => {
  const connectionString = await connectionStrings.utils.decrypt(connection.id)

  return {
    ...connection,
    connectionString: prepareConnectionStringToCloud(
      connectionString,
      connection.syncType
    ),
    isPasswordExists: connection.isPasswordExists,
  }
}

export interface ConnectionResource extends BaseTable {
  connectionId: string
  name: string | null
}

export const createConnectionsCollection = (
  connectionStrings: ConnectionStringsCollection
) =>
  createCollection(
    persistedCollectionOptions({
      ...syncCollectionOptions<Connection>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.connections.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'connections',
        onDelete: async ({ transaction }) => {
          await orpc.connections.remove.call(
            transaction.mutations.map((m) => ({ id: m.key }))
          )
        },
        onInsert: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map(async (m) =>
              orpc.connections.create.call(
                await prepareConnectionToCloud(connectionStrings, m.modified)
              )
            )
          )
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.connections.update.call({
                id: m.key,
                ...m.changes,
              })
            )
          )
        },
        sync: ({ rows, signal }) =>
          orpc.connections.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: PERSISTED_SCHEMA_VERSION,
    })
  )

export const createConnectionsResourcesCollection = () =>
  createCollection(
    persistedCollectionOptions({
      ...syncCollectionOptions<ConnectionResource>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.connectionsResources.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'connections-resources',
        onDelete: async ({ transaction }) => {
          await orpc.connectionsResources.remove.call(
            transaction.mutations.map((m) => ({ id: m.key }))
          )
        },
        onInsert: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.connectionsResources.create.call(m.modified)
            )
          )
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.connectionsResources.update.call({ id: m.key, ...m.changes })
            )
          )
        },
        sync: ({ rows, signal }) =>
          orpc.connectionsResources.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: PERSISTED_SCHEMA_VERSION,
    })
  )
