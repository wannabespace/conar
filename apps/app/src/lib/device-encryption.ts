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

const withKey = (key: CryptoKey) => ({
  decrypt: (encrypted: string) => decryptWithKey(key, encrypted),
  encrypt: (text: string) => encryptWithKey(key, text),
})

// The device keeps the key it started with: strings encrypted under one key never decrypt under the other. Only a device without an IndexedDB key asks for the keychain one, so the two never both exist.
const backend = memoize(async () => {
  await db.ready
  const { encryptionKey } = storage.get()
  if (encryptionKey) {
    return withKey(encryptionKey)
  }
  const keychain = window.electron?.deviceEncryption
  if (keychain && (await keychain.createKey())) {
    return keychain
  }
  const key = await crypto.subtle.generateKey(
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
  await storage.set({ encryptionKey: key })
  return withKey(key)
})

export const deviceEncryption = {
  decrypt: async (encrypted: string) => {
    const { decrypt } = await backend()
    return decrypt(encrypted)
  },
  encrypt: async (text: string) => {
    const { encrypt } = await backend()
    return encrypt(text)
  },
  reset: async () => {
    clearMemoizeCache(backend)
    await Promise.all([
      storage.set({ encryptionKey: null }),
      window.electron?.deviceEncryption.reset(),
    ])
  },
}
