import { v7 as uuid } from 'uuid'
import { describe, expect, it } from 'vitest'
import { decodeBase64, encodeBase64 } from './base64'
import { decrypt, encrypt } from './crypto'

const superSecretInformation = 'hello'
const userKey = uuid()
const secretKey = `${userKey}-some-random-string-from-env`
const wrongSecretKey = `${userKey}-some-other-random-string-from-env`

describe('crypto', () => {
  it('should encrypt', () => {
    const encrypted = encrypt(superSecretInformation, secretKey)

    expect(encrypted).toEqual({
      encrypted: expect.any(String),
      iv: expect.any(String),
      tag: expect.any(String),
      salt: expect.any(String),
    })
  })

  it('should decrypt', () => {
    const encrypted = encrypt(superSecretInformation, secretKey)
    const decrypted = decrypt(encrypted, secretKey)

    expect(decrypted).toBe(superSecretInformation)
  })

  it('should not decrypt with wrong secret key', () => {
    const encrypted = encrypt(superSecretInformation, secretKey)
    const decrypted = decrypt(encrypted, wrongSecretKey)

    expect(decrypted).toBeNull()
  })

  it('should encode and decode crypto', () => {
    const userSecret = 'some-secret-key'

    const encrypted = encrypt(superSecretInformation, userSecret)
    const encoded = encodeBase64(JSON.stringify(encrypted))

    const decoded = JSON.parse(decodeBase64(encoded))

    expect(encrypted).toEqual(decoded)
    expect(decrypt(decoded, userSecret)).toBe(superSecretInformation)
  })
})
