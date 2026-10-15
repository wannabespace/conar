import type { SecretParam } from '@tamery/connection/secrets'
import { connectionSecrets } from '@tamery/connection/secrets'
import { describeConnectionString } from '@tamery/connection/utils'
import { isKeychainLocked } from '@tamery/shared/keychain'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import type { PersistedCollectionUtils } from '@tanstack/db-sqlite-persistence-core'
import type { Collection } from '@tanstack/react-db'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { toast } from 'sonner'

import { fullSignOut } from '~/lib/auth'
import { persistence } from '~/lib/database'
import { deviceEncryption } from '~/lib/device-encryption'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { PERSISTED_SCHEMA_VERSION } from '~/lib/sync'

import type { ConnectionResource } from './sync'

export interface ConnectionString {
  connectionId: string
  encrypted: string
  updatedAt: Date
  isPasswordPopulated: boolean
  usesSsh: boolean
  missingSecrets: SecretParam[]
  displayUrl: string
  defaultResourceName: string | null
}

type ConnectionStringInput = Pick<
  ConnectionString,
  'connectionId' | 'updatedAt'
> & {
  connectionString: string
}

// oxlint-disable-next-line typescript/consistent-type-definitions
type ConnectionStringsUtils = {
  decrypt: (connectionId: string) => Promise<string>
  resolve: (connection: {
    id: string
    isPasswordExists: boolean
  }) => Promise<string | null>
  save: (data: ConnectionStringInput) => Promise<{
    previous: ConnectionStringInput | null
    record: ConnectionString
  }>
}

export type ConnectionStringsCollection = Collection<
  ConnectionString,
  string,
  ConnectionStringsUtils & PersistedCollectionUtils
>

export const createConnectionStringsCollection = (
  resources: Collection<ConnectionResource>
): ConnectionStringsCollection => {
  const collection: ConnectionStringsCollection = createCollection(
    persistedCollectionOptions<
      ConnectionString,
      string,
      never,
      ConnectionStringsUtils
    >({
      autoIndex: 'eager',
      defaultIndexType: BasicIndex,
      gcTime: 0,
      getKey: (item) => item.connectionId,
      id: 'connection-strings',
      persistence,
      schemaVersion: PERSISTED_SCHEMA_VERSION,
      utils: {
        async decrypt(connectionId: string) {
          const record = collection.get(connectionId)

          if (!record) {
            const result = await orpc.connections.resolve.call({
              id: connectionId,
            })

            if (result.status === 'modified') {
              return result.connectionString
            }

            throw new Error(
              `No connection string found for connection "${connectionId}"`
            )
          }

          try {
            return await deviceEncryption.decrypt(record.encrypted)
          } catch (error) {
            if (!isKeychainLocked(error)) {
              await fullSignOut()
              toast.error(
                'Your encryption key is invalid. Please, sign in again.',
                { id: 'encryption-key-invalid' }
              )
            }
            throw error
          }
        },
        async resolve({ id: connectionId, isPasswordExists }) {
          const local = collection.get(connectionId)

          const result = await orpc.connections.resolve.call({
            id: connectionId,
            updatedAt: local?.updatedAt,
          })

          if (result.status === 'unchanged') {
            return null
          }

          if (result.status === 'not-found') {
            return collection.utils.decrypt(connectionId)
          }

          if (!collection.has(connectionId)) {
            return result.connectionString
          }

          return connectionSecrets.restore(result.connectionString, {
            isPasswordExists,
            local: await collection.utils.decrypt(connectionId),
          })
        },
        async save(data) {
          const stored = collection.get(data.connectionId)
          const [previous, encrypted] = await Promise.all([
            stored
              ? collection.utils
                  .decrypt(stored.connectionId)
                  .then((connectionString) => ({
                    connectionId: stored.connectionId,
                    connectionString,
                    updatedAt: stored.updatedAt,
                  }))
              : null,
            deviceEncryption.encrypt(data.connectionString),
          ])
          const record = {
            ...describeConnectionString(data.connectionString),
            connectionId: data.connectionId,
            encrypted,
            updatedAt: data.updatedAt,
          }
          if (collection.has(data.connectionId)) {
            collection.update(data.connectionId, (draft) => {
              Object.assign(draft, record)
            })
          } else {
            collection.insert(record)
          }
          // Compares the plain strings: a rename re-resolves the same string under a new `updatedAt`.
          if (previous?.connectionString !== data.connectionString) {
            const ids = new Set<unknown>([
              data.connectionId,
              ...resources.toArray
                .filter(
                  ({ connectionId }) => connectionId === data.connectionId
                )
                .map(({ id }) => id),
            ])
            queryClient.removeQueries({
              predicate: ({ queryKey: [, id] }) => ids.has(id),
            })
          }
          return { previous, record }
        },
      },
    })
  )

  return collection
}
