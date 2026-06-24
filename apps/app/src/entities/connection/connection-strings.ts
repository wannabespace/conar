import type { Collection } from '@tanstack/react-db'
import { isLocalhostConnectionString } from '@conar/connection/utils'
import { decryptWithKey, encryptWithKey } from '@conar/shared/utils/crypto-web'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { toast } from 'sonner'
import { fullSignOut } from '~/lib/auth'
import { encryptionKey } from '~/lib/encryption-key'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'
import { getCollections } from './collections'

export interface ConnectionString {
  connectionId: string
  encrypted: string
  updatedAt: Date
  isPasswordPopulated: boolean
  isLocalhost: boolean
  displayUrl: string
  defaultResourceName: string | null
}

async function encryptConnectionString(connectionString: string) {
  return encryptWithKey(await encryptionKey.get(), connectionString)
}

async function decryptConnectionString(encryptedConnectionString: string) {
  return decryptWithKey(await encryptionKey.get(), encryptedConnectionString)
}

// eslint-disable-next-line ts/consistent-type-definitions
type ConnectionStringsUtils = {
  decrypt: (connectionId: string) => Promise<string>
  prepare: (data: Pick<ConnectionString, 'connectionId' | 'updatedAt'> & { connectionString: string }) => Promise<ConnectionString>
  resolve: (connectionId: string) => Promise<string | null>
}

type ConnectionStringsCollection = Collection<ConnectionString, string, ConnectionStringsUtils>

async function preserveLocalPassword(connectionId: string, connectionString: string) {
  const url = new SafeURL(connectionString)
  const { connectionStringsCollection } = getCollections()
  const local = connectionStringsCollection.get(connectionId)

  if (url.password || !local?.isPasswordPopulated)
    return connectionString

  url.password = new SafeURL(await connectionStringsCollection.utils.decrypt(connectionId)).password

  return url.toString()
}

export function createConnectionStringsCollection(): ConnectionStringsCollection {
  return createCollection(persistedCollectionOptions<ConnectionString, string, never, ConnectionStringsUtils>({
    id: 'connection-strings',
    persistence,
    autoIndex: 'eager',
    gcTime: 0,
    defaultIndexType: BasicIndex,
    schemaVersion: 1,
    getKey: item => item.connectionId,
    utils: {
      async decrypt(connectionId: string) {
        const record = getCollections().connectionStringsCollection.get(connectionId)

        if (!record)
          throw new Error(`No connection string found for connection "${connectionId}"`)

        try {
          return await decryptConnectionString(record.encrypted)
        }
        catch (error) {
          await fullSignOut()
          toast.error('Your encryption key is invalid. Please, sign in again.', {
            id: 'encryption-key-invalid',
          })
          throw error
        }
      },
      async prepare(data: { connectionId: string, connectionString: string, updatedAt: Date }) {
        const encrypted = await encryptConnectionString(data.connectionString)
        const url = new SafeURL(data.connectionString)
        return {
          connectionId: data.connectionId,
          encrypted,
          updatedAt: data.updatedAt,
          isPasswordPopulated: !!url.password,
          isLocalhost: isLocalhostConnectionString(data.connectionString),
          displayUrl: `${url.hostname}${url.port ? `:${url.port}` : ''}`,
          defaultResourceName: url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : null,
        }
      },
      async resolve(connectionId: string) {
        const { connectionStringsCollection } = getCollections()
        const local = connectionStringsCollection.get(connectionId)

        const result = await orpc.connections.resolve.call({ id: connectionId, updatedAt: local?.updatedAt })

        if (result.status === 'unchanged')
          return null

        // This case can be when the connection is just created and not yet synced to the cloud but the user is already added it
        if (result.status === 'not-found') {
          return connectionStringsCollection.utils.decrypt(connectionId)
        }

        return preserveLocalPassword(connectionId, result.connectionString)
      },
    },
  }))
}
