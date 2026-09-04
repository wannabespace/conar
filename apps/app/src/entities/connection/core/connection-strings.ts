import { isLocalhostConnectionString } from '@tamery/connection/utils'
import { decryptWithKey, encryptWithKey } from '@tamery/shared/utils/crypto-web'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import type { Collection } from '@tanstack/react-db'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { toast } from 'sonner'

import { getCollections } from '~/entities/collections'
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

type ConnectionStringsCollection = Collection<
  ConnectionString,
  string,
  ConnectionStringsUtils
>

const preserveLocalPassword = async (
  connectionId: string,
  connectionString: string
) => {
  const url = new SafeURL(connectionString)
  const { connectionStringsCollection } = getCollections()
  const local = connectionStringsCollection.get(connectionId)

  if (url.password || !local?.isPasswordPopulated) {
    return connectionString
  }

  url.password = new SafeURL(
    await connectionStringsCollection.utils.decrypt(connectionId)
  ).password

  return url.toString()
}

export const createConnectionStringsCollection =
  (): ConnectionStringsCollection =>
    createCollection(
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
            const record =
              getCollections().connectionStringsCollection.get(connectionId)

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
            const url = new SafeURL(data.connectionString)
            return {
              connectionId: data.connectionId,
              defaultResourceName:
                url.pathname && url.pathname !== '/'
                  ? url.pathname.slice(1)
                  : null,
              displayUrl: `${url.hostname}${url.port ? `:${url.port}` : ''}`,
              encrypted,
              isLocalhost: isLocalhostConnectionString(data.connectionString),
              isPasswordPopulated: !!url.password,
              updatedAt: data.updatedAt,
            }
          },
          async resolve(connectionId: string) {
            const { connectionStringsCollection } = getCollections()
            const local = connectionStringsCollection.get(connectionId)

            const result = await orpc.connections.resolve.call({
              id: connectionId,
              updatedAt: local?.updatedAt,
            })

            if (result.status === 'unchanged') {
              return null
            }

            // This case can be when the connection is just created and not yet synced to the cloud but the user is already added it
            if (result.status === 'not-found') {
              return connectionStringsCollection.utils.decrypt(connectionId)
            }

            return preserveLocalPassword(connectionId, result.connectionString)
          },
        },
      })
    )
