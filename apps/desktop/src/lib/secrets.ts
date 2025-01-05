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

export async function createEncryptor(secret: string) {
  const preparedSecret = await prepareSecret(secret)

  return {
    encrypt: <T>(data: T) => encryptText(JSON.stringify(data), preparedSecret),
    decrypt: async <T>(encryptedText: string) => JSON.parse(await decryptText(encryptedText, preparedSecret)) as T,
  }
}
