import { invoke } from '@tauri-apps/api/core'
import { trpc } from '~/trpc'

export function prepareSecret(secret: string) {
  return invoke<string>('prepare_secret', {
    secret,
  })
}

export async function createEncryptor(secret: string) {
  const preparedSecret = await prepareSecret(secret)

  return {
    encrypt: <T>(data: T) => trpc.crypto.encrypt.mutate({ data: JSON.stringify(data), secret: preparedSecret }),
    decrypt: async <T>(encryptedText: string) => JSON.parse(await trpc.crypto.decrypt.mutate({ encryptedText, secret: preparedSecret })) as T,
  }
}
