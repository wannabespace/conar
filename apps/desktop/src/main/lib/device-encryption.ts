import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { KEYCHAIN_LOCKED_ERROR } from '@tamery/shared/keychain'
import { tryCatchAsync } from '@tamery/shared/utils'
import { safeStorage } from 'electron'
import Store from 'electron-store'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12
const TAG_BYTES = 16

const store = new Store<{ wrappedKey?: string }>({ name: 'encryption-key' })

let key: Promise<Buffer> | null = null
let creation: Promise<boolean> | null = null

// Linux falls back to `basic_text` without a keyring, which only obfuscates: the renderer's own key is no worse.
const isUsable = async () =>
  (await safeStorage.isAsyncEncryptionAvailable()) &&
  (process.platform !== 'linux' ||
    safeStorage.getSelectedStorageBackend() !== 'basic_text')

// Electron fetches the keychain once per run, so a denied prompt fails every call until restart: it must read as locked, never as a wrong key, which the renderer resets.
const unwrap = async (wrapped: string) => {
  const { data } = await tryCatchAsync(() =>
    safeStorage.decryptStringAsync(Buffer.from(wrapped, 'base64'))
  )
  if (!data?.result) {
    throw new Error(KEYCHAIN_LOCKED_ERROR)
  }
  if (data.shouldReEncrypt) {
    const rewrapped = await safeStorage.encryptStringAsync(data.result)
    store.set('wrappedKey', rewrapped.toString('base64'))
  }
  return Buffer.from(data.result, 'base64')
}

const deviceKey = async () => {
  const wrapped = store.get('wrappedKey')
  if (!wrapped) {
    throw new Error(KEYCHAIN_LOCKED_ERROR)
  }
  key ??= unwrap(wrapped)
  try {
    return await key
  } catch (error) {
    key = null
    throw error
  }
}

const create = async () => {
  if (store.has('wrappedKey')) {
    return true
  }
  if (!(await isUsable())) {
    return false
  }
  const created = randomBytes(KEY_BYTES)
  const { data: wrapped } = await tryCatchAsync(() =>
    safeStorage.encryptStringAsync(created.toString('base64'))
  )
  if (!wrapped) {
    return false
  }
  store.set('wrappedKey', wrapped.toString('base64'))
  key = Promise.resolve(created)
  return true
}

/** Encrypts local connection strings with a device key that never leaves this process. Same layout as `crypto-web`: IV, ciphertext, then the GCM tag. */
export const deviceEncryption = {
  /** Shared by every window: two windows creating at once would each mint a key and orphan the other's strings. */
  createKey: () => {
    creation ??= create()
    return creation
  },
  decrypt: async (encrypted: string) => {
    const bytes = Buffer.from(encrypted, 'base64')
    const decipher = createDecipheriv(
      ALGORITHM,
      await deviceKey(),
      bytes.subarray(0, IV_BYTES)
    )
    decipher.setAuthTag(bytes.subarray(-TAG_BYTES))
    return Buffer.concat([
      decipher.update(bytes.subarray(IV_BYTES, -TAG_BYTES)),
      decipher.final(),
    ]).toString('utf-8')
  },
  encrypt: async (text: string) => {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv(ALGORITHM, await deviceKey(), iv)
    return Buffer.concat([
      iv,
      cipher.update(text, 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64')
  },
  hasKey: () => store.has('wrappedKey'),
  reset: () => {
    key = null
    creation = null
    store.delete('wrappedKey')
  },
}
