import { describe, expect, it } from 'bun:test'
import { nanoid } from 'nanoid'
import { decrypt, encrypt } from './encryption'

const secret = 'supersecret'

describe('encryption', () => {
  it('should encrypt data successfully', () => {
    const encrypted = encrypt({ text: 'Hello, World!', secret })
    expect(encrypted).toBeDefined()
    expect(typeof encrypted).toBe('string')
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('should decrypt encrypted data correctly', () => {
    const encrypted = encrypt({ text: 'Hello, World!', secret })
    const decrypted = decrypt({
      encryptedText: encrypted,
      secret,
    })

    expect(decrypted).toBe('Hello, World!')
  })

  it('should fail decryption with wrong password', () => {
    const encrypted = encrypt({ text: 'Hello, World!', secret })

    expect(() => decrypt({
      encryptedText: encrypted,
      secret: 'wrongPassword',
    })).toThrow()
  })

  it('should fail decryption with corrupted encrypted text', () => {
    const encrypted = encrypt({ text: 'Hello, World!', secret })
    const corruptedText = encrypted.slice(10)

    expect(() => decrypt({
      encryptedText: corruptedText,
      secret,
    })).toThrow()
  })

  it('should encrypt nanoid', () => {
    const id = nanoid()
    const encrypted = encrypt({ text: id, secret })
    const decrypted = decrypt({ encryptedText: encrypted, secret })

    expect(decrypted).toBe(id)
  })

  it('should handle double encryption and decryption', () => {
    const text = 'Hello, World!'
    const firstEncryption = encrypt({ text, secret })
    const secondEncryption = encrypt({ text: firstEncryption, secret })

    const firstDecryption = decrypt({ encryptedText: secondEncryption, secret })
    const finalDecryption = decrypt({ encryptedText: firstDecryption, secret })

    expect(finalDecryption).toBe(text)
  })
})
