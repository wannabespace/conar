import { invoke } from '@tauri-apps/api/core'
import { decrypt, encrypt } from './encryption'

function prepareSecret(secret: string) {
  return invoke<string>('prepare_secret', {
    secret,
  })
}

export async function createEncryptor(secret: string) {
  const preparedSecret = await prepareSecret(secret)

  return {
    encrypt: (text: string) => encrypt({ text, secret: preparedSecret }),
    decrypt: (encryptedText: string) => decrypt({ encryptedText, secret: preparedSecret }),
  }
}
