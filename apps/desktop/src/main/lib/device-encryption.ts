import { decryptWithKey, encryptWithKey } from '@tamery/shared/crypto-web'
import { KEYCHAIN_LOCKED_ERROR } from '@tamery/shared/keychain'
import { silently, tryCatchAsync } from '@tamery/shared/utils'
import { safeStorage } from 'electron'
import Store from 'electron-store'

const KEY_BYTES = 32

const store = new Store<{ wrappedKey?: string }>({ name: 'encryption-key' })

let key: Promise<CryptoKey> | null = null
let creation: Promise<boolean> | null = null

const importKey = (raw: Uint8Array<ArrayBuffer>) =>
  crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])

// Electron fetches the keychain once per run, so a denied prompt fails every call until restart: it must read as locked, never as a wrong key, which the renderer resets.
const unwrap = async (wrapped: string) => {
  const { data } = await tryCatchAsync(() =>
    safeStorage.decryptStringAsync(Buffer.from(wrapped, 'base64'))
  )
  if (!data?.result) {
    throw new Error(KEYCHAIN_LOCKED_ERROR)
  }
  if (data.shouldReEncrypt) {
    // The key already unwrapped: a failed re-wrap must not fail the decrypt, which the renderer reads as a wrong key and signs out.
    await silently(async () => {
      const rewrapped = await safeStorage.encryptStringAsync(data.result)
      store.set('wrappedKey', rewrapped.toString('base64'))
    })
  }
  return importKey(new Uint8Array(Buffer.from(data.result, 'base64')))
}

const deviceKey = () => {
  const wrapped = store.get('wrappedKey')
  if (!wrapped) {
    throw new Error(KEYCHAIN_LOCKED_ERROR)
  }
  key ??= unwrap(wrapped)
  return key
}

const create = async () => {
  if (store.has('wrappedKey')) {
    return true
  }
  // Linux falls back to `basic_text` without a keyring, which only obfuscates: the renderer's own key is no worse.
  if (
    !(await safeStorage.isAsyncEncryptionAvailable()) ||
    (process.platform === 'linux' &&
      safeStorage.getSelectedStorageBackend() === 'basic_text')
  ) {
    return false
  }
  const created = crypto.getRandomValues(new Uint8Array(KEY_BYTES))
  const { data: wrapped } = await tryCatchAsync(() =>
    safeStorage.encryptStringAsync(Buffer.from(created).toString('base64'))
  )
  if (!wrapped) {
    return false
  }
  store.set('wrappedKey', wrapped.toString('base64'))
  key = importKey(created)
  return true
}

export const deviceEncryption = {
  /** Shared by every window: two windows creating at once would each mint a key and orphan the other's strings. */
  createKey: () => {
    creation ??= create()
    return creation
  },
  decrypt: async (encrypted: string) =>
    decryptWithKey(await deviceKey(), encrypted),
  encrypt: async (text: string) => encryptWithKey(await deviceKey(), text),
  reset: async () => {
    // A creation still in flight would write its key after the delete and hand the next account this one's key.
    await creation
    key = null
    creation = null
    store.delete('wrappedKey')
  },
}
