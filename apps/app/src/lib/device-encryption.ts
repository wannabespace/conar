import { decryptWithKey, encryptWithKey } from '@tamery/shared/crypto-web'
import {
  isKeychainLocked,
  KEYCHAIN_LOCKED_ERROR,
} from '@tamery/shared/keychain'
import { type } from 'arktype'
import { clearMemoizeCache, memoize } from 'memoza'
import { createIndexedDb, createIndexedDbStorage } from 'seitu/web'
import { toast } from 'sonner'

import { posthog } from './posthog'

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

// IndexedDB key first: a device never switches keys, since strings encrypted under one never decrypt under the other.
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

export const restartToUnlock = () => {
  posthog.capture('app_restarted_to_unlock')
  window.electron?.app.relaunch()
}

const withBackend = async <T>(
  run: (keys: ReturnType<typeof withKey>) => Promise<T>
) => {
  try {
    return await run(await backend())
  } catch (error) {
    if (isKeychainLocked(error)) {
      toast.error(KEYCHAIN_LOCKED_ERROR, {
        action: { label: 'Restart', onClick: restartToUnlock },
        id: 'keychain-locked',
      })
    }
    throw error
  }
}

export const deviceEncryption = {
  decrypt: (encrypted: string) =>
    withBackend(({ decrypt }) => decrypt(encrypted)),
  encrypt: (text: string) => withBackend(({ encrypt }) => encrypt(text)),
  reset: async () => {
    clearMemoizeCache(backend)
    await Promise.all([
      storage.set({ encryptionKey: null }),
      window.electron?.deviceEncryption.reset(),
    ])
  },
}
