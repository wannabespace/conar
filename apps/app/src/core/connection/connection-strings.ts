import { isLocalHost } from '@tamery/connection/hosts'
import { parseConnectionString } from '@tamery/connection/parse-connection-string'
import type { SecretParam } from '@tamery/connection/secrets'
import { connectionSecrets } from '@tamery/connection/secrets'
import { sshTunnelOf } from '@tamery/connection/ssh/params'
import { decryptWithKey, encryptWithKey } from '@tamery/shared/crypto-web'
import { SafeURL } from '@tamery/shared/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import type { PersistedCollectionUtils } from '@tanstack/db-sqlite-persistence-core'
import type { Collection } from '@tanstack/react-db'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { toast } from 'sonner'

import { fullSignOut } from '~/lib/auth'
import { persistence } from '~/lib/database'
import { encryptionKey } from '~/lib/encryption-key'
import { orpc } from '~/lib/orpc'
import { PERSISTED_SCHEMA_VERSION } from '~/lib/sync'

export interface ConnectionString {
  connectionId: string
  encrypted: string
  updatedAt: Date
  isPasswordPopulated: boolean
  isLocalhost: boolean
  usesSsh: boolean
  missingSecrets: SecretParam[]
  displayUrl: string
  defaultResourceName: string | null
}

const encryptConnectionString = async (connectionString: string) =>
  encryptWithKey(await encryptionKey.get(), connectionString)

const decryptConnectionString = async (encryptedConnectionString: string) =>
  decryptWithKey(await encryptionKey.get(), encryptedConnectionString)

// oxlint-disable-next-line typescript/consistent-type-definitions
type ConnectionStringsUtils = {
  decrypt: (connectionId: string) => Promise<string>
  prepare: (
    data: Pick<ConnectionString, 'connectionId' | 'updatedAt'> & {
      connectionString: string
    }
  ) => Promise<ConnectionString>
  resolve: (connectionId: string) => Promise<string | null>
}

export type ConnectionStringsCollection = Collection<
  ConnectionString,
  string,
  ConnectionStringsUtils & PersistedCollectionUtils
>

const preserveLocalSecrets = async (
  collection: ConnectionStringsCollection,
  connectionId: string,
  connectionString: string
) => {
  const local = collection.get(connectionId)

  if (!local) {
    return connectionString
  }

  return connectionSecrets.restore(
    connectionString,
    await collection.utils.decrypt(connectionId)
  )
}

export const createConnectionStringsCollection =
  (): ConnectionStringsCollection => {
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
              return await decryptConnectionString(record.encrypted)
            } catch (error) {
              await fullSignOut()
              toast.error(
                'Your encryption key is invalid. Please, sign in again.',
                {
                  id: 'encryption-key-invalid',
                }
              )
              throw error
            }
          },
          async prepare(data: {
            connectionId: string
            connectionString: string
            updatedAt: Date
          }) {
            const encrypted = await encryptConnectionString(
              data.connectionString
            )
            const { database, host, password, searchParams } =
              parseConnectionString(data.connectionString)
            return {
              connectionId: data.connectionId,
              defaultResourceName: database ?? null,
              displayUrl: new SafeURL(data.connectionString).host,
              encrypted,
              isLocalhost: isLocalHost(host),
              isPasswordPopulated: !!password,
              missingSecrets: connectionSecrets.missing(searchParams),
              updatedAt: data.updatedAt,
              usesSsh: sshTunnelOf(searchParams) !== null,
            }
          },
          async resolve(connectionId: string) {
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

            return preserveLocalSecrets(
              collection,
              connectionId,
              result.connectionString
            )
          },
        },
      })
    )

    return collection
  }
