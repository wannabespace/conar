import { invoke } from '@tauri-apps/api/core'
import { describe, expect, it, vi } from 'vitest'
import { createEncryptor } from './secrets'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command, args) => `${args.secret}some-random-string`),
}))

describe('secrets', () => {
  describe('createEncryptor', () => {
    it('should create an encryptor with encrypt and decrypt functions', async () => {
      const encryptor = await createEncryptor('test-secret')

      expect(encryptor).toHaveProperty('encrypt')
      expect(encryptor).toHaveProperty('decrypt')
      expect(typeof encryptor.encrypt).toBe('function')
      expect(typeof encryptor.decrypt).toBe('function')
    })

    it('should encrypt and decrypt text correctly', async () => {
      const encryptor = await createEncryptor('test-secret')
      const originalText = 'hello'

      const encrypted = await encryptor.encrypt(originalText)
      expect(invoke).toHaveBeenCalledWith('prepare_secret', { secret: 'test-secret' })

      const decrypted = await encryptor.decrypt(encrypted)
      expect(decrypted).toBe(originalText)
    })
  })
})
