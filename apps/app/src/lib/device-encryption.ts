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

const cipher = (key: CryptoKey) => ({
  decrypt: (encrypted: string) => decryptWithKey(key, encrypted),
  encrypt: (text: string) => encryptWithKey(key, text),
})

// IndexedDB key first: a device never switches keys, since strings encrypted under one never decrypt under the other.
const deviceCipher = memoize(async () => {
  await db.ready
  const saved = storage.get().encryptionKey
  if (saved) {
    return cipher(saved)
  }

  const keychain = window.electron?.deviceEncryption
  if (keychain && (await keychain.createKey())) {
    return keychain
  }

  const generated = await crypto.subtle.generateKey(
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
  await storage.set({ encryptionKey: generated })
  return cipher(generated)
})

export const restartToUnlock = () => {
  posthog.capture('app_restarted_to_unlock')
  window.electron?.app.relaunch()
}

const toastIfLocked = async <T>(operation: Promise<T>) => {
  try {
    return await operation
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
  decrypt: async (encrypted: string) => {
    const { decrypt } = await deviceCipher()
    return toastIfLocked(decrypt(encrypted))
  },
  encrypt: async (text: string) => {
    const { encrypt } = await deviceCipher()
    return toastIfLocked(encrypt(text))
  },
  reset: async () => {
    clearMemoizeCache(deviceCipher)
    await Promise.all([
      storage.set({ encryptionKey: null }),
      window.electron?.deviceEncryption.reset(),
    ])
  },
}
