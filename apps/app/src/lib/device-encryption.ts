import { decryptWithKey, encryptWithKey } from '@tamery/shared/crypto-web'
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

// The device keeps the key it started with: strings encrypted under one key never decrypt under the other.
const keychainEncryption = memoize(async () => {
  const keychain = window.electron?.deviceEncryption ?? null
  if (!keychain || (await keychain.hasKey())) {
    return keychain
  }
  await db.ready
  if (storage.get().encryptionKey) {
    return null
  }
  return (await keychain.createKey()) ? keychain : null
})

const indexedDbKey = memoize(async (): Promise<CryptoKey> => {
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

export const deviceEncryption = {
  decrypt: async (encrypted: string) => {
    const keychain = await keychainEncryption()
    return keychain
      ? keychain.decrypt(encrypted)
      : decryptWithKey(await indexedDbKey(), encrypted)
  },
  encrypt: async (text: string) => {
    const keychain = await keychainEncryption()
    return keychain
      ? keychain.encrypt(text)
      : encryptWithKey(await indexedDbKey(), text)
  },
  reset: async () => {
    clearMemoizeCache(indexedDbKey)
    clearMemoizeCache(keychainEncryption)
    await Promise.all([
      storage.set({ encryptionKey: null }),
      window.electron?.deviceEncryption.reset(),
    ])
  },
}
