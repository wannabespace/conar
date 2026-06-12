import { isLocalhostConnectionString } from '@conar/connection/utils'
import { base64ToBytes, bytesToBase64 } from '@conar/shared/utils/base64'
import { decryptWithKey, encryptWithKey } from '@conar/shared/utils/crypto-web'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { useSubscription } from 'seitu/react'
import { createIndexedDbStorage } from 'seitu/web'

const safeStorageAvailable = memoize(() => window.electron ? window.electron.safeStorage.isEncryptionAvailable() : false)

function importAesKey(raw: Uint8Array<ArrayBuffer>) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

const connectionsStringsStorage = createIndexedDbStorage({
  databaseName: 'secure-storage',
  storeName: 'connections-strings',
  schemas: {
    // Browser uses CryptoKey, Electron uses string
    encryptionKey: type.instanceOf(CryptoKey).or('string').or('null'),
    connectionStrings: type({
      '[string]': {
        encrypted: 'string',
        metadata: {
          isPasswordPopulated: 'boolean',
          isLocalhost: 'boolean',
          displayUrl: 'string',
          defaultResourceName: 'string | null',
        },
      },
    }),
  },
  defaultValues: {
    encryptionKey: null,
    connectionStrings: {},
  },
})

function resetEncryptionKey() {
  return connectionsStringsStorage.set({ encryptionKey: null, connectionStrings: {} })
}

const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await connectionsStringsStorage.ready

  const stored = connectionsStringsStorage.get().encryptionKey

  if (stored instanceof CryptoKey)
    return stored

  if (window.electron && (await safeStorageAvailable())) {
    const { safeStorage } = window.electron

    if (typeof stored === 'string') {
      try {
        return importAesKey(base64ToBytes(await safeStorage.decryptString(stored)))
      }
      catch {
        await resetEncryptionKey()
      }
    }

    const raw = crypto.getRandomValues(new Uint8Array(32))
    await connectionsStringsStorage.set({ encryptionKey: await safeStorage.encryptString(bytesToBase64(raw)) })
    return importAesKey(raw)
  }

  // String can be only in electron
  // So we should clear the key because somehow safe storage is not available anymore
  if (typeof stored === 'string')
    await resetEncryptionKey()

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await connectionsStringsStorage.set({ encryptionKey: key })
  return key
})

async function encryptConnectionString(connectionString: string) {
  return encryptWithKey(await getEncryptionKey(), connectionString)
}

async function decryptConnectionString(encryptedConnectionString: string) {
  return decryptWithKey(await getEncryptionKey(), encryptedConnectionString)
}

export const connectionStringStorage = {
  ready: connectionsStringsStorage.ready,
  has: (id: string) => id in connectionsStringsStorage.get().connectionStrings,
  get: (id: string) => connectionsStringsStorage.get().connectionStrings[id],
  decrypt: (id: string): Promise<string> => {
    const record = connectionsStringsStorage.get().connectionStrings[id]
    if (!record)
      throw new Error(`No connection string found for connection "${id}"`)
    return decryptConnectionString(record.encrypted)
  },
  set: async (id: string, connectionString: string) => {
    const url = new SafeURL(connectionString)
    const encrypted = await encryptConnectionString(connectionString)
    await connectionsStringsStorage.set(prev => ({
      connectionStrings: {
        ...prev.connectionStrings,
        [id]: {
          encrypted,
          metadata: {
            isPasswordPopulated: !!url.password,
            isLocalhost: isLocalhostConnectionString(connectionString),
            displayUrl: `${url.hostname}${url.port ? `:${url.port}` : ''}`,
            defaultResourceName: url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : null,
          },
        },
      },
    }))
  },
  remove: async (id: string) => {
    await connectionsStringsStorage.set((prev) => {
      const connectionStrings = { ...prev.connectionStrings }
      delete connectionStrings[id]
      return { connectionStrings }
    })
  },
  clear: () => connectionsStringsStorage.set({ connectionStrings: {} }),
}

export function useConnectionString(id: string) {
  return useSubscription(connectionsStringsStorage, { selector: state => state.connectionStrings[id] })
}
