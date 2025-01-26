import { decrypt, encrypt } from '@connnect/shared/encryption'
import { invoke } from '@tauri-apps/api/core'

const secrets = new Map<string, string>()

async function prepareSecret(secret: string) {
  if (secrets.has(secret)) {
    return secrets.get(secret)!
  }

  const preparedSecret = await invoke<string>('prepare_secret', {
    secret,
  })

  secrets.set(secret, preparedSecret)

  return preparedSecret
}

export async function createEncryptor(secret: string) {
  const preparedSecret = await prepareSecret(secret)

  return {
    encrypt: (text: string) => encrypt({ text, secret: preparedSecret }),
    decrypt: (encryptedText: string) => decrypt({ encryptedText, secret: preparedSecret }),
  }
}
