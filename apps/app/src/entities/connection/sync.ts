import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ORPCOutputs } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

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

export async function prepareConnectionToCloud(connection: Connection, decrypt: (id: string) => Promise<string>) {
  const connectionString = await decrypt(connection.id)

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

export function createConnectionCollections({ decrypt }: { decrypt: (id: string) => Promise<string> }) {
  const connectionsCollection = createCollection(persistedCollectionOptions<Connection, string>({
    id: 'connections',
    persistence,
    autoIndex: 'eager',
    gcTime: 1,
    defaultIndexType: BasicIndex,
    schemaVersion: 1,
    getKey: item => item.id,
    sync: {
      sync: ({ begin, commit, write, collection, markReady }) => {
        const abortController = new AbortController()

        const writeItem = (item: ORPCOutputs['connections']['sync'][number]) => {
          if (item.type === 'delete') {
            write({
              type: 'delete',
              key: item.key,
            })
          }
          else {
            write({
              type: item.type,
              value: item.value,
            })
          }
        }

        orpc.connections.events.call({}, {
          signal: abortController.signal,
        })
          .then(async (events) => {
            if (abortController.signal.aborted)
              return
            markReady()
            for await (const item of events) {
              if (abortController.signal.aborted)
                break
              begin()
              writeItem(item)
              commit()
            }
          })
          .catch(() => {
            if (!abortController.signal.aborted)
              markReady()
          })

        collection.toArrayWhenReady().then(async (rows) => {
          const sync = await orpc.connections.sync.call(
            rows,
            { signal: abortController.signal },
          )
          if (abortController.signal.aborted)
            return
          begin()
          for (const item of sync) {
            writeItem(item)
          }
          commit()
        })

        return () => {
          abortController.abort()
        }
      },
    },
    onInsert: async ({ transaction }) => {
      await orpc.connections.create.call(
        await Promise.all(transaction.mutations.map(m => prepareConnectionToCloud(m.modified, decrypt))),
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
  }))

  const connectionsResourcesCollection = createCollection(persistedCollectionOptions<ConnectionResource, string>({
    id: 'connections-resources',
    persistence,
    autoIndex: 'eager',
    gcTime: 1,
    defaultIndexType: BasicIndex,
    schemaVersion: 1,
    getKey: item => item.id,
    sync: {
      sync: ({ begin, commit, write, collection, markReady }) => {
        const abortController = new AbortController()

        const writeItem = (item: ORPCOutputs['connectionsResources']['sync'][number]) => {
          if (item.type === 'delete') {
            write({
              type: 'delete',
              key: item.key,
            })
          }
          else {
            write({
              type: item.type,
              value: item.value,
            })
          }
        }

        orpc.connectionsResources.events.call({}, {
          signal: abortController.signal,
        })
          .then(async (events) => {
            if (abortController.signal.aborted)
              return
            markReady()
            for await (const item of events) {
              if (abortController.signal.aborted)
                break
              begin()
              writeItem(item)
              commit()
            }
          })
          .catch(() => {
            if (!abortController.signal.aborted)
              markReady()
          })

        collection.toArrayWhenReady().then(async (rows) => {
          if (abortController.signal.aborted)
            return
          const sync = await orpc.connectionsResources.sync.call(
            rows,
            { signal: abortController.signal },
          )
          if (abortController.signal.aborted)
            return
          begin()
          for (const item of sync) {
            writeItem(item)
          }
          commit()
        })

        return () => {
          abortController.abort()
        }
      },
    },
    onInsert: async ({ transaction }) => {
      await orpc.connectionsResources.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
    },
    onDelete: async ({ transaction }) => {
      await orpc.connectionsResources.remove.call(transaction.mutations.map(m => ({ id: m.key })))
    },
  }))

  return {
    connectionsCollection,
    connectionsResourcesCollection,
  }
}
