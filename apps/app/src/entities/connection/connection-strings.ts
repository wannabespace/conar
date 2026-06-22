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

interface StoredConnectionString {
  id: string
  encrypted: string
  updatedAt: Date
  metadata: {
    isPasswordPopulated: boolean
    isLocalhost: boolean
    displayUrl: string
    defaultResourceName: string | null
  }
}

const resolvePromises = new Map<string, Promise<void>>()

async function encryptValue(connectionString: string) {
  return encryptWithKey(await getEncryptionKey(), connectionString)
}

async function decryptValue(encryptedConnectionString: string) {
  return decryptWithKey(await getEncryptionKey(), encryptedConnectionString)
}

function buildRecord(id: string, connectionString: string, encrypted: string, updatedAt: Date): StoredConnectionString {
  const url = new SafeURL(connectionString)

  return {
    id,
    encrypted,
    updatedAt,
    metadata: {
      isPasswordPopulated: !!url.password,
      isLocalhost: isLocalhostConnectionString(connectionString),
      displayUrl: `${url.hostname}${url.port ? `:${url.port}` : ''}`,
      defaultResourceName: url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : null,
    },
  }
}

// eslint-disable-next-line ts/consistent-type-definitions
type ConnectionStringsUtils = {
  decrypt: (id: string) => Promise<string>
  upsert: (id: string, connectionString: string, updatedAt: Date) => Promise<void>
  ready: () => Promise<void>
  resolve: (id: string) => Promise<void>
}

type ConnectionStringsCollection = Collection<StoredConnectionString, string, ConnectionStringsUtils>

export function createConnectionStringsCollection() {
  const connectionStringsCollection: ConnectionStringsCollection = createCollection(persistedCollectionOptions<StoredConnectionString, string, never, ConnectionStringsUtils>({
    id: 'connection-strings',
    persistence,
    autoIndex: 'eager',
    gcTime: 1,
    defaultIndexType: BasicIndex,
    schemaVersion: 1,
    getKey: item => item.id,
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
          throw error
        }
      },
      async upsert(id: string, connectionString: string, updatedAt: Date): Promise<void> {
        const encrypted = await encryptValue(connectionString)
        const record = buildRecord(id, connectionString, encrypted, updatedAt)

        if (connectionStringsCollection.has(id)) {
          connectionStringsCollection.update(id, draft => Object.assign(draft, record))
        }
        else {
          connectionStringsCollection.insert(record)
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
        // await connectionStringsCollection.waitFor('index:added')
        const existing = resolvePromises.get(id)
        if (existing)
          return existing

        const local = connectionStringsCollection.get(id)

        const promise = (async () => {
          const { publicKey, privateKey } = await generateEncryptionKeyPair()
          const result = await orpc.connections.resolve.call({ id, publicKey, updatedAt: local?.updatedAt })

          if (result.status === 'unchanged')
            return

          const connectionString = await decryptWithPrivateKey(privateKey, result.connectionString)
          await connectionStringsCollection.utils.upsert(id, await preserveLocalPassword(id, connectionString), result.updatedAt)
        })().finally(() => {
          resolvePromises.delete(id)
        })

        resolvePromises.set(id, promise)
        return promise
      },
    },
  }))

  async function preserveLocalPassword(id: string, connectionString: string) {
    const url = new SafeURL(connectionString)
    const local = connectionStringsCollection.get(id)

    if (!url.password && local?.metadata.isPasswordPopulated) {
      url.password = new SafeURL(await connectionStringsCollection.utils.decrypt(id)).password
    }

    return url.toString()
  }

  return {
    connectionStringsCollection,
  }
}
