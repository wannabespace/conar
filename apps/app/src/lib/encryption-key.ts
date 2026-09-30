import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDb, createIndexedDbStorage } from 'seitu/web'

const db = createIndexedDb({
  name: 'secure-storage',
  stores: {
    'encryption-key': createIndexedDbStorage({
      defaultValues: {
        encryptionKey: null,
      },
      schemas: {
        encryptionKey: type.instanceOf(CryptoKey).or('null'),
      },
    }),
  },
})

const storage = db.stores['encryption-key']

const getEncryptionKey = memoize(async (): Promise<CryptoKey> => {
  await db.ready

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
