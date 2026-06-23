import type { Collection } from '@tanstack/react-db'
import { isLocalhostConnectionString } from '@conar/connection/utils'
import { decryptWithKey, encryptWithKey } from '@conar/shared/utils/crypto-web'
import { decryptWithPrivateKey, generateEncryptionKeyPair } from '@conar/shared/utils/pair-keys'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { encryptionKeyStorage, getEncryptionKey, resetEncryptionKey } from '~/lib/encryption-key-storage'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

export interface ConnectionString {
  connectionId: string
  encrypted: string
  updatedAt: Date
  isPasswordPopulated: boolean
  isLocalhost: boolean
  displayUrl: string
  defaultResourceName: string | null
}

async function encryptValue(connectionString: string) {
  return encryptWithKey(await getEncryptionKey(), connectionString)
}

async function decryptValue(encryptedConnectionString: string) {
  return decryptWithKey(await getEncryptionKey(), encryptedConnectionString)
}

// eslint-disable-next-line ts/consistent-type-definitions
type ConnectionStringsUtils = {
  decrypt: (id: string) => Promise<string>
  prepare: (data: Pick<ConnectionString, 'connectionId' | 'updatedAt'> & { connectionString: string }) => Promise<ConnectionString>
  ready: () => Promise<void>
  resolve: (id: string) => Promise<string | null>
}

const resolvePromises = new Map<string, Promise<string | null>>()

type ConnectionStringsCollection = Collection<ConnectionString, string, ConnectionStringsUtils>

export const connectionStringsCollection: ConnectionStringsCollection = createCollection(persistedCollectionOptions<ConnectionString, string, never, ConnectionStringsUtils>({
  id: 'connection-strings',
  persistence,
  autoIndex: 'eager',
  gcTime: 1,
  defaultIndexType: BasicIndex,
  schemaVersion: 1,
  getKey: item => item.connectionId,
  utils: {
    async decrypt(id: string): Promise<string> {
      const record = connectionStringsCollection.get(id)
      if (!record)
        throw new Error(`No connection string found for connection "${id}"`)

      try {
        return await decryptValue(record.encrypted)
      }
      catch (error) {
        await resetEncryptionKey()

        for (const item of connectionStringsCollection.toArray) {
          connectionStringsCollection.delete(item.connectionId)
        }

        throw error
      }
    },
    async prepare(data: { connectionId: string, connectionString: string, updatedAt: Date }) {
      const encrypted = await encryptValue(data.connectionString)
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
    async ready() {
      await Promise.all([
        encryptionKeyStorage.ready,
        connectionStringsCollection.stateWhenReady(),
        Promise.allSettled(resolvePromises.values()),
      ])
    },
    async resolve(id: string) {
      const existing = resolvePromises.get(id)
      if (existing)
        return existing

      const local = connectionStringsCollection.get(id)

      const promise = (async () => {
        const { publicKey, privateKey } = await generateEncryptionKeyPair()
        const result = await orpc.connections.resolve.call({ id, publicKey, updatedAt: local?.updatedAt })

        if (result.status === 'unchanged')
          return null

        // This case can be when the connection is just created and not yet synced to the cloud but the user is already added it
        if (result.status === 'not-found') {
          return connectionStringsCollection.utils.decrypt(id)
        }

        const connectionString = await decryptWithPrivateKey(privateKey, result.connectionString)
        return preserveLocalPassword(id, connectionString)
      })().finally(() => {
        resolvePromises.delete(id)
      })

      resolvePromises.set(id, promise)
      return promise
    },
  },
}))

async function preserveLocalPassword(connectionId: string, connectionString: string) {
  const url = new SafeURL(connectionString)
  const local = connectionStringsCollection.get(connectionId)

  if (url.password || !local?.isPasswordPopulated)
    return connectionString

  url.password = new SafeURL(await connectionStringsCollection.utils.decrypt(connectionId)).password

  return url.toString()
}
