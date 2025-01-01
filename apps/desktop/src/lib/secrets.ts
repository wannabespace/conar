import { invoke } from '@tauri-apps/api/core'

export function prepareSecret(secret: string) {
  return invoke<string>('prepare_secret', {
    secret,
  })
}

function encryptText(text: string, secret: string) {
  return invoke<string>('encrypt_text', {
    text,
    secret,
  })
}

function decryptText(encryptedText: string, secret: string) {
  return invoke<string>('decrypt_text', {
    encryptedText,
    secret,
  })
}

export async function secretStringify<T>(data: T, secret: string) {
  const preparedSecret = await prepareSecret(secret)
  const encrypted = await encryptText(JSON.stringify(data), preparedSecret)
  return encrypted
}

export async function secretParse<T>(encrypted: string, secret: string) {
  const preparedSecret = await prepareSecret(secret)
  const decrypted = await decryptText(encrypted, preparedSecret)
  return JSON.parse(decrypted) as T
}
