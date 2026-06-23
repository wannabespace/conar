import { base64ToBytes, bytesToBase64 } from '@conar/shared/utils/base64'
import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDbStorage } from 'seitu/web'
import { fullSignOut } from './auth'

export const encryptionStorage = createIndexedDbStorage({
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
    await fullSignOut()
    throw new Error('Secure storage is not available on this device, so connection credentials cannot be protected. You have been signed out.')
  }

  const stored = encryptionStorage.get().encryptionKey

  if (typeof stored === 'string') {
    try {
      return await importAesKey(base64ToBytes(await safeStorage.decryptString(stored)))
    }
    catch {
      await resetEncryptionKey()
    }
  }

  const raw = crypto.getRandomValues(new Uint8Array(32))
  await encryptionStorage.set({ encryptionKey: await safeStorage.encryptString(bytesToBase64(raw)) })
  return importAesKey(raw)
}

async function getWebEncryptionKey(): Promise<CryptoKey> {
  const stored = encryptionStorage.get().encryptionKey

  if (stored instanceof CryptoKey)
    return stored

  const key = await generateAesKey()
  await encryptionStorage.set({ encryptionKey: key })
  return key
}

export const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await encryptionStorage.ready

  return window.electron
    ? getElectronEncryptionKey(window.electron.safeStorage)
    : getWebEncryptionKey()
})

export function resetEncryptionKey() {
  clearMemoizeCache(getEncryptionKey)
  return encryptionStorage.set({ encryptionKey: null })
}
