import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDbStorage } from 'seitu/web'

export const storage = createIndexedDbStorage({
  databaseName: 'secure-storage',
  defaultValues: {
    encryptionKey: null,
  },
  schemas: {
    encryptionKey: type.instanceOf(CryptoKey).or('null'),
  },
  storeName: 'encryption-key',
})

const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await storage.ready

  const stored = storage.get().encryptionKey

  if (stored) {
    return stored
  }

  const key = await crypto.subtle.generateKey(
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
  await storage.set({ encryptionKey: key })

  return key
})

const resetEncryptionKey = () => {
  clearMemoizeCache(getEncryptionKey)
  return storage.set({ encryptionKey: null })
}

export const encryptionKey = {
  get: getEncryptionKey,
  reset: resetEncryptionKey,
}
