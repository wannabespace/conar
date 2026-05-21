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

export interface ConnectionMutationMetadata {
  cloudSync?: false
}

export interface Connection extends BaseTable {
  type: ConnectionType
  name: string
  connectionString: string
  label: string | null
  color: string | null
  isPasswordExists: boolean
  isPasswordPopulated: boolean
  syncType: SyncType
}

export const connectionsCollection = createCollection(persistedCollectionOptions<Connection, string>({
  id: 'connections',
  persistence,
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  schemaVersion: 1,
  getKey: item => item.id,
  sync: {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()

      const writeItem = async (item: ORPCOutputs['connections']['sync'][number]) => {
        if (item.type === 'insert') {
          write({
            type: 'insert',
            value: {
              ...item.value,
              isPasswordPopulated: !!new SafeURL(item.value.connectionString).password,
            },
          })
        }
        else if (item.type === 'update') {
          const existed = collection.get(item.value.id)

          if (!existed) {
            throw new Error('Entity not found')
          }

          const cloudPassword = new SafeURL(item.value.connectionString).password
          const localPassword = new SafeURL(existed.connectionString).password
          const newConnectionString = new SafeURL(item.value.connectionString)

          if (item.value.syncType === SyncType.CloudWithoutPassword && localPassword && !cloudPassword) {
            newConnectionString.password = localPassword
          }

          write({
            type: 'update',
            value: {
              ...item.value,
              connectionString: newConnectionString.toString(),
              isPasswordPopulated: !!newConnectionString.password,
              syncType: item.value.syncType ?? SyncType.CloudWithoutPassword,
            },
          })
        }
        else if (item.type === 'delete') {
          write({
            type: 'delete',
            key: item.key,
          })
        }
      }

      orpc.connections.events.call({}, {
        signal: abortController.signal,
      })
        .then(async (events) => {
          markReady()
          for await (const item of events) {
            begin()
            writeItem(item)
            commit()
          }
        })
        .catch(() => {
          markReady()
        })

      collection.toArrayWhenReady().then(async (rows) => {
        orpc.connections.sync.call(
          rows,
          { signal: abortController.signal },
        )
          .then(async (sync) => {
            begin()
            for (const item of sync) {
              writeItem(item)
            }
            commit()
          })
      })

      return () => {
        abortController.abort()
      }
    },
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.create.call({
      ...m.modified,
      connectionString: prepareConnectionStringToCloud(m.modified.connectionString, m.modified.syncType),
    })))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connections.update.call({
      id: m.key,
      ...m.changes,
      ...(m.changes.connectionString
        ? { connectionString: prepareConnectionStringToCloud(m.changes.connectionString, m.modified.syncType) }
        : {}),
    })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.connections.remove.call(mutations.map(m => ({ id: m.key })))
  },
}))

export interface ConnectionResourcesMutationMetadata {
  cloudSync?: false
}

export interface ConnectionResource extends BaseTable {
  connectionId: string
  name: string | null
}

export const connectionsResourcesCollection = createCollection(persistedCollectionOptions<ConnectionResource, string>({
  id: 'connections-resources',
  persistence,
  autoIndex: 'eager',
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
          markReady()
          for await (const item of events) {
            begin()
            writeItem(item)
            commit()
          }
        })
        .catch(() => {
          markReady()
        })

      collection.toArrayWhenReady().then(async (rows) => {
        orpc.connectionsResources.sync.call(
          rows,
          { signal: abortController.signal },
        )
          .then(async (sync) => {
            begin()
            for (const item of sync) {
              writeItem(item)
            }
            commit()
          })
      })

      return () => {
        abortController.abort()
      }
    },
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connectionsResources.create.call(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.connectionsResources.update.call({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ConnectionResourcesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.connectionsResources.remove.call(mutations.map(m => ({ id: m.key })))
  },
}))
