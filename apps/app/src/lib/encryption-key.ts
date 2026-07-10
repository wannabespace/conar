import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDbStorage } from 'seitu/web'

export const storage = createIndexedDbStorage({
  databaseName: 'secure-storage',
  storeName: 'encryption-key',
  schemas: {
    encryptionKey: type.instanceOf(CryptoKey).or('null'),
  },
  defaultValues: {
    encryptionKey: null,
  },
})

const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await storage.ready

  const stored = storage.get().encryptionKey

  if (stored) return stored

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
  await storage.set({ encryptionKey: key })

  return key
})

function resetEncryptionKey() {
  clearMemoizeCache(getEncryptionKey)
  return storage.set({ encryptionKey: null })
}

export const encryptionKey = {
  get: getEncryptionKey,
  reset: resetEncryptionKey,
}
