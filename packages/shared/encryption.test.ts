import { describe, expect, it } from 'vitest'
import { decrypt, encrypt } from './encryption'

const secret = 'supersecret'

describe('encryption', () => {
  it('should encrypt data successfully', async () => {
    const encrypted = await encrypt({ text: 'Hello, World!', secret })
    expect(encrypted).toBeDefined()
    expect(typeof encrypted).toBe('string')
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('should decrypt encrypted data correctly', async () => {
    const encrypted = await encrypt({ text: 'Hello, World!', secret })
    const decrypted = await decrypt({
      encryptedText: encrypted,
      secret,
    })

    expect(decrypted).toBe('Hello, World!')
  })

  it('should fail decryption with wrong password', async () => {
    const encrypted = await encrypt({ text: 'Hello, World!', secret })

    await expect(decrypt({
      encryptedText: encrypted,
      secret: 'wrongPassword',
    })).resolves.toBeNull()
  })

  it('should fail decryption with corrupted encrypted text', async () => {
    const encrypted = await encrypt({ text: 'Hello, World!', secret })
    const corruptedText = encrypted.slice(10)

    await expect(decrypt({
      encryptedText: corruptedText,
      secret,
    })).resolves.toBeNull()
  })
})
