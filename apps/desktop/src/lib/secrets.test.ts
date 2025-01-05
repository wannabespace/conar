import { describe, expect, it, vi } from 'vitest'
import { createEncryptor, prepareSecret } from './secrets'

const LOCAL_SECRET = 'some-random-string-from-env'

function prepareSecretMock(secret: string) {
  return `${secret}${LOCAL_SECRET}`
}

function encryptTextMock(text: string, preparedSecret: string) {
  return `${text}${preparedSecret}`
}

function decryptTextMock(encryptedText: string, preparedSecret: string) {
  return encryptedText.slice(0, -preparedSecret.length)
}

vi.mock('@tauri-apps/api/core', () => ({
  // eslint-disable-next-line ts/no-explicit-any
  invoke: (name: 'prepare_secret' | 'encrypt_text' | 'decrypt_text', args: any) => {
    if (name === 'prepare_secret') {
      return Promise.resolve(prepareSecretMock(args.secret))
    }

    if (name === 'encrypt_text') {
      const _args = args as { text: string, secret: string }

      return Promise.resolve(encryptTextMock(_args.text, _args.secret))
    }

    if (name === 'decrypt_text') {
      const _args = args as { encryptedText: string, secret: string }

      return Promise.resolve(decryptTextMock(_args.encryptedText, _args.secret))
    }

    return Promise.reject(new Error('Unknown method'))
  },
}))

describe('secrets', () => {
  it('should prepare a secret', async () => {
    const secret = await prepareSecret('secret')

    expect(secret).not.toEqual('secret')
  })

  it('should encrypt data', async () => {
    const secret = 'secret'
    const encryptor = await createEncryptor(secret)
    const data = { foo: 'bar' }
    const encrypted = await encryptor.encrypt(data)

    expect(encrypted).not.toEqual(JSON.stringify(data))
    expect(typeof encrypted).toBe('string')
  })

  it('should decrypt data', async () => {
    const secret = 'secret'
    const encryptor = await createEncryptor(secret)
    const data = { foo: 'bar' }
    const encrypted = await encryptor.encrypt(data)
    const decrypted = await encryptor.decrypt(encrypted)

    expect(decrypted).toEqual(data)
  })
})
