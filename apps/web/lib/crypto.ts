import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const algorithm = 'aes-256-gcm'
const ivLength = 12
const saltLength = 16
const keyLength = 32

export function encrypt(text: string, secretKey: string) {
  const iv = randomBytes(ivLength)
  const salt = randomBytes(saltLength)
  const key = scryptSync(secretKey, salt, keyLength)
  const cipher = createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    salt: salt.toString('hex'),
  }
}

export function decrypt(encrypted: ReturnType<typeof encrypt>, secretKey: string) {
  const key = scryptSync(secretKey, Buffer.from(encrypted.salt, 'hex'), keyLength)

  const decipher = createDecipheriv(
    algorithm,
    key,
    Buffer.from(encrypted.iv, 'hex'),
  )

  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))

  try {
    let decrypted = decipher.update(encrypted.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
  catch {
    return null
  }
}
