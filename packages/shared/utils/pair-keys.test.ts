import { describe, expect, it } from 'bun:test'
import { decryptWithPrivateKey, encryptWithPublicKey, generateEncryptionKeyPair } from './pair-keys'

describe('pair-keys', () => {
  it('round-trips a connection string', async () => {
    const text = 'postgresql://user:p@ss@localhost:5432/db'
    const { publicKey, privateKey } = await generateEncryptionKeyPair()
    const encrypted = await encryptWithPublicKey({ text, publicKey })
    const decrypted = await decryptWithPrivateKey(privateKey, encrypted)

    expect(decrypted).toBe(text)
  })

  it('round-trips long connection strings', async () => {
    const text = `postgresql://admin:${'x'.repeat(400)}@db.example.com:5432/very_long_db_name?sslmode=require`
    const { publicKey, privateKey } = await generateEncryptionKeyPair()
    const encrypted = await encryptWithPublicKey({ text, publicKey })
    const decrypted = await decryptWithPrivateKey(privateKey, encrypted)

    expect(decrypted).toBe(text)
  })

  it('round-trips unicode characters', async () => {
    const text = 'mysql://用户:пароль@127.0.0.1:3306/テスト'
    const { publicKey, privateKey } = await generateEncryptionKeyPair()
    const encrypted = await encryptWithPublicKey({ text, publicKey })
    const decrypted = await decryptWithPrivateKey(privateKey, encrypted)

    expect(decrypted).toBe(text)
  })

  it('produces different ciphertext for the same input', async () => {
    const text = 'postgresql://user@localhost:5432/db'
    const { publicKey, privateKey } = await generateEncryptionKeyPair()
    const first = await encryptWithPublicKey({ text, publicKey })
    const second = await encryptWithPublicKey({ text, publicKey })

    expect(first).not.toBe(second)
    expect(await decryptWithPrivateKey(privateKey, first)).toBe(text)
    expect(await decryptWithPrivateKey(privateKey, second)).toBe(text)
  })

  it('fails decryption with the wrong private key', async () => {
    const text = 'postgresql://user@localhost:5432/db'
    const { publicKey } = await generateEncryptionKeyPair()
    const { privateKey: wrongPrivateKey } = await generateEncryptionKeyPair()
    const encrypted = await encryptWithPublicKey({ text, publicKey })

    expect(decryptWithPrivateKey(wrongPrivateKey, encrypted)).rejects.toThrow()
  })

  it('fails decryption with corrupted payload', async () => {
    const { privateKey } = await generateEncryptionKeyPair()

    expect(decryptWithPrivateKey(privateKey, 'invalid.payload')).rejects.toThrow()
  })
})
