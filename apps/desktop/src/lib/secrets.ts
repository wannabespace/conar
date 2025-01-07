import { invoke } from '@tauri-apps/api/core'
import { decrypt, encrypt } from './encryption'

export function prepareSecret(secret: string) {
  return invoke<string>('prepare_secret', {
    secret,
  })
}

export async function createEncryptor(secret: string) {
  const preparedSecret = await prepareSecret(secret)

  return {
    encrypt: <T>(data: T) => encrypt({ data: JSON.stringify(data), secret: preparedSecret }),
    decrypt: async <T>(encryptedText: string) => JSON.parse(await decrypt({ encryptedText, secret: preparedSecret })) as T,
  }
}
