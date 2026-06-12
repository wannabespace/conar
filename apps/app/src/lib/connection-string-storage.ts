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

const storage = createIndexedDbStorage({
  databaseName: 'conar-secure-storage',
  schemas: {
    encryptionKey: type.instanceOf(CryptoKey).or('string').or('null'),
    connectionStrings: type({
      '[string]': {
        encrypted: 'string',
        isPasswordPopulated: 'boolean',
        isLocalhost: 'boolean',
        displayUrl: 'string',
        defaultResourceName: 'string | null',
      },
    }),
  },
  defaultValues: {
    encryptionKey: null,
    connectionStrings: {},
  },
})

// When the stored key becomes unrecoverable (safe storage no longer available,
// or its keyring backend changed), the encrypted data is lost too, so drop both
// and start fresh instead of hard-failing.
function resetEncryptionKey() {
  return storage.set({ encryptionKey: null, connectionStrings: {} })
}

// Data is always encrypted/decrypted with Web Crypto (AES-GCM). The only
// platform-specific piece is where the AES key lives at rest: on desktop the
// key is wrapped with Electron safeStorage (OS keychain), on web it is kept as
// a non-extractable CryptoKey in IndexedDB.
const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await storage.ready

  const stored = storage.get().encryptionKey

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
    await storage.set({ encryptionKey: await safeStorage.encryptString(bytesToBase64(raw)) })
    return importAesKey(raw)
  }

  // No safe storage: a leftover wrapped (string) key from a desktop session
  // can no longer be unwrapped here.
  if (typeof stored === 'string')
    await resetEncryptionKey()

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await storage.set({ encryptionKey: key })
  return key
})

async function encryptConnectionString(connectionString: string) {
  return encryptWithKey(await getEncryptionKey(), connectionString)
}

async function decryptConnectionString(encryptedConnectionString: string) {
  return decryptWithKey(await getEncryptionKey(), encryptedConnectionString)
}

export const connectionStringStorage = {
  ready: storage.ready,

  has: (id: string) => id in storage.get().connectionStrings,

  get: (id: string) => storage.get().connectionStrings[id],

  decrypt: (id: string): Promise<string> => {
    const record = storage.get().connectionStrings[id]
    if (!record)
      throw new Error(`No connection string found for connection "${id}"`)
    return decryptConnectionString(record.encrypted)
  },

  set: async (id: string, connectionString: string) => {
    const url = new SafeURL(connectionString)
    const encrypted = await encryptConnectionString(connectionString)
    await storage.set(prev => ({
      connectionStrings: {
        ...prev.connectionStrings,
        [id]: {
          encrypted,
          isPasswordPopulated: !!url.password,
          isLocalhost: isLocalhostConnectionString(connectionString),
          displayUrl: `${url.hostname}${url.port ? `:${url.port}` : ''}`,
          defaultResourceName: url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : null,
        },
      },
    }))
  },

  remove: async (id: string) => {
    await storage.set((prev) => {
      const connectionStrings = { ...prev.connectionStrings }
      delete connectionStrings[id]
      return { connectionStrings }
    })
  },

  clear: () => storage.set({ connectionStrings: {} }),
}

// Reactive read of a connection's stored info. Unlike `get`, this re-renders the
// component whenever the record changes (e.g. once the password is populated or
// the connection string is resolved), so password-dependent gating stays in sync.
export function useConnectionStringInfo(id: string) {
  return useSubscription(storage, {
    selector: state => state.connectionStrings[id],
  })
}
