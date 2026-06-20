import { isLocalhostConnectionString } from '@conar/connection/utils'
import { base64ToBytes, bytesToBase64 } from '@conar/shared/utils/base64'
import { decryptWithKey, encryptWithKey } from '@conar/shared/utils/crypto-web'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { useSubscription } from 'seitu/react'
import { createIndexedDbStorage } from 'seitu/web'
import { orpc } from '~/lib/orpc'
import { fullSignOut } from './auth'

const storage = createIndexedDbStorage({
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

type SafeStorage = NonNullable<typeof window.electron>['safeStorage']

function importAesKey(raw: Uint8Array<ArrayBuffer>) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function generateAesKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function getElectronEncryptionKey(safeStorage: SafeStorage): Promise<CryptoKey> {
  if (!(await safeStorage.isEncryptionAvailable())) {
    await fullSignOut()
    throw new Error('Secure storage is not available on this device, so connection credentials cannot be protected. You have been signed out.')
  }

  const stored = storage.get().encryptionKey

  if (typeof stored === 'string') {
    try {
      return await importAesKey(base64ToBytes(await safeStorage.decryptString(stored)))
    }
    catch {
      await resetEncryptionKey()
    }
  }

  const raw = crypto.getRandomValues(new Uint8Array(32))
  await storage.set({ encryptionKey: await safeStorage.encryptString(bytesToBase64(raw)) })
  return importAesKey(raw)
}

async function getWebEncryptionKey(): Promise<CryptoKey> {
  const stored = storage.get().encryptionKey

  if (stored instanceof CryptoKey)
    return stored

  const key = await generateAesKey()
  await storage.set({ encryptionKey: key })
  return key
}

const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await storage.ready

  return window.electron
    ? getElectronEncryptionKey(window.electron.safeStorage)
    : getWebEncryptionKey()
})

function resetEncryptionKey() {
  clearMemoizeCache(getEncryptionKey)
  return storage.set({ encryptionKey: null, connectionStrings: {} })
}

async function encryptConnectionString(connectionString: string) {
  return encryptWithKey(await getEncryptionKey(), connectionString)
}

async function decryptConnectionString(encryptedConnectionString: string) {
  return decryptWithKey(await getEncryptionKey(), encryptedConnectionString)
}

const resolvePromises = new Map<string, Promise<void>>()

export const connectionStringStorage = {
  get ready() {
    return Promise.all([
      storage.ready,
      Promise.allSettled(resolvePromises.values()).then(() => {}),
    ])
  },
  has: (id: string) => id in storage.get().connectionStrings,
  get: (id: string) => storage.get().connectionStrings[id],
  resolve: (id: string): Promise<void> => {
    const existing = resolvePromises.get(id)
    if (existing)
      return existing

    const promise = (async () => {
      const { connectionString } = await orpc.connections.resolve.call({ id })
      await connectionStringStorage.set(id, connectionString)
    })().finally(() => {
      resolvePromises.delete(id)
    })

    resolvePromises.set(id, promise)
    return promise
  },
  decrypt: async (id: string): Promise<string> => {
    const record = connectionStringStorage.get(id)
    if (!record)
      throw new Error(`No connection string found for connection "${id}"`)
    try {
      return await decryptConnectionString(record.encrypted)
    }
    catch (error) {
      await resetEncryptionKey()
      throw error
    }
  },
  set: async (id: string, connectionString: string) => {
    const url = new SafeURL(connectionString)
    const encrypted = await encryptConnectionString(connectionString)
    await storage.set(prev => ({
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
    await storage.set((prev) => {
      const connectionStrings = { ...prev.connectionStrings }
      delete connectionStrings[id]
      return { connectionStrings }
    })
  },
  clear: () => storage.set({ connectionStrings: {} }),
}

export function useConnectionString(id: string) {
  return useSubscription(storage, { selector: state => state.connectionStrings[id] })
}
