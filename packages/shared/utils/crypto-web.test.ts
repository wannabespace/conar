import { beforeAll, describe, expect, it } from 'bun:test'

import { nanoid } from 'nanoid'

import { decryptWithKey, encryptWithKey } from './crypto-web'

let key: CryptoKey

beforeAll(async () => {
  key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
})

describe('encryption', () => {
  it('should encrypt data successfully', async () => {
    const encrypted = await encryptWithKey(key, 'Hello, World!')
    expect(encrypted).toBeDefined()
    expect(typeof encrypted).toBe('string')
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('should decrypt encrypted data correctly', async () => {
    const encrypted = await encryptWithKey(key, 'Hello, World!')
    const decrypted = await decryptWithKey(key, encrypted)

    expect(decrypted).toBe('Hello, World!')
  })

  it('should produce different ciphertext for the same input', async () => {
    const first = await encryptWithKey(key, 'Hello, World!')
    const second = await encryptWithKey(key, 'Hello, World!')

    expect(first).not.toBe(second)
    expect(await decryptWithKey(key, first)).toBe('Hello, World!')
    expect(await decryptWithKey(key, second)).toBe('Hello, World!')
  })

  it('should fail decryption with wrong key', async () => {
    const encrypted = await encryptWithKey(key, 'Hello, World!')
    const wrongKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ])

    expect(decryptWithKey(wrongKey, encrypted)).rejects.toThrow()
  })

  it('should fail decryption with corrupted encrypted text', async () => {
    const encrypted = await encryptWithKey(key, 'Hello, World!')
    const corruptedText = encrypted.slice(10)

    expect(decryptWithKey(key, corruptedText)).rejects.toThrow()
  })

  it('should encrypt nanoid', async () => {
    const id = nanoid()
    const encrypted = await encryptWithKey(key, id)
    const decrypted = await decryptWithKey(key, encrypted)

    expect(decrypted).toBe(id)
  })

  it('should handle double encryption and decryption', async () => {
    const text = 'Hello, World!'
    const firstEncryption = await encryptWithKey(key, text)
    const secondEncryption = await encryptWithKey(key, firstEncryption)

    const firstDecryption = await decryptWithKey(key, secondEncryption)
    const finalDecryption = await decryptWithKey(key, firstDecryption)

    expect(finalDecryption).toBe(text)
  })

  it('works with unicode characters', async () => {
    const input = 'こんにちは世界🌏'
    const encrypted = await encryptWithKey(key, input)
    const decrypted = await decryptWithKey(key, encrypted)

    expect(decrypted).toBe(input)
  })
})
