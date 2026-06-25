import { base64ToBytes, bytesToBase64 } from '@conar/shared/utils/base64'
import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDbStorage } from 'seitu/web'

export const storage = createIndexedDbStorage({
  databaseName: 'secure-storage',
  storeName: 'encryption-key',
  schemas: {
    // Browser uses CryptoKey, Electron uses string
    encryptionKey: type.instanceOf(CryptoKey).or('string').or('null'),
  },
  defaultValues: {
    encryptionKey: null,
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
    return getWebEncryptionKey()
  }

  const stored = storage.get().encryptionKey

  if (typeof stored === 'string') {
    try {
      return importAesKey(base64ToBytes(await safeStorage.decryptString(stored)))
    }
    catch {
      // The keychain changed
      await storage.set({ encryptionKey: null })
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
  return storage.set({ encryptionKey: null })
}

export const encryptionKey = {
  get: getEncryptionKey,
  reset: resetEncryptionKey,
}
