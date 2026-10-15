import { decryptWithKey, encryptWithKey } from '@tamery/shared/crypto-web'
import { KEYCHAIN_LOCKED_ERROR } from '@tamery/shared/keychain'
import { silently } from '@tamery/shared/utils'
import { Result } from 'better-result'
import { safeStorage } from 'electron'
import Store from 'electron-store'

const KEY_BYTES = 32

const store = new Store<{ wrappedKey?: string }>({ name: 'encryption-key' })

let key: Promise<CryptoKey> | null = null
let creation: Promise<boolean> | null = null

const importKey = (raw: Uint8Array<ArrayBuffer>) =>
  crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])

// A denied prompt must read as locked, never as a wrong key, which the renderer resets.
const unwrap = async (wrapped: string) => {
  const decrypted = await Result.tryPromise(() =>
    safeStorage.decryptStringAsync(Buffer.from(wrapped, 'base64'))
  )
  if (decrypted.isErr() || !decrypted.value.result) {
    throw new Error(KEYCHAIN_LOCKED_ERROR)
  }
  const data = decrypted.value
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
  if (
    !(await safeStorage.isAsyncEncryptionAvailable()) ||
    (process.platform === 'linux' &&
      safeStorage.getSelectedStorageBackend() === 'basic_text')
  ) {
    return false
  }
  const created = crypto.getRandomValues(new Uint8Array(KEY_BYTES))
  const wrapped = await Result.tryPromise(() =>
    safeStorage.encryptStringAsync(Buffer.from(created).toString('base64'))
  )
  if (wrapped.isErr()) {
    return false
  }
  store.set('wrappedKey', wrapped.value.toString('base64'))
  key = importKey(created)
  return true
}

export const deviceEncryption = {
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
