import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32
const SALT_LENGTH = 16

export function encrypt({ text, secret }: { text: string, secret: string }) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  const key = crypto.pbkdf2Sync(secret, salt, 1, KEY_LENGTH, 'sha256')

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${salt.toString('base64')}`
}

export function decrypt({ encryptedText, secret }: { encryptedText: string, secret: string }) {
  try {
    const [ivBase64, encryptedBase64, saltBase64] = encryptedText.split('.')

    if (!ivBase64 || !encryptedBase64 || !saltBase64) {
      throw new Error('Failed to decrypt text')
    }

    const iv = Buffer.from(ivBase64, 'base64')
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    const salt = Buffer.from(saltBase64, 'base64')

    const authTag = encrypted.subarray(encrypted.length - 16)
    const ciphertext = encrypted.subarray(0, encrypted.length - 16)

    const key = crypto.pbkdf2Sync(secret, salt, 1, KEY_LENGTH, 'sha256')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8')
  }
  catch {
    throw new Error('Failed to decrypt text')
  }
}
