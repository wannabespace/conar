import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16
const SALT = crypto.randomBytes(16)

export function encrypt({ text, secret }: { text: string, secret: string }) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = crypto.scryptSync(secret, SALT, 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}.${encrypted}.${SALT.toString('hex')}`
}

export function decrypt({ encryptedText, secret }: { encryptedText: string, secret: string }) {
  try {
    const [ivHex, text, saltHex] = encryptedText.split('.')

    if (!ivHex || !text || !saltHex) {
      throw new Error('Failed to decrypt text')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const salt = Buffer.from(saltHex, 'hex')
    const key = crypto.scryptSync(secret, salt, 32)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(text, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
  catch {
    throw new Error('Failed to decrypt text')
  }
}
