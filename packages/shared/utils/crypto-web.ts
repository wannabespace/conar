import { base64ToBytes, bytesToBase64 } from './base64'

const IV_LENGTH = 12

export const encryptWithKey = async (key: CryptoKey, text: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { iv, name: 'AES-GCM' },
    key,
    new TextEncoder().encode(text)
  )
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.byteLength)
  return bytesToBase64(combined)
}

export const decryptWithKey = async (key: CryptoKey, encryptedText: string) => {
  const bytes = base64ToBytes(encryptedText)
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { iv: bytes.slice(0, IV_LENGTH), name: 'AES-GCM' },
      key,
      bytes.slice(IV_LENGTH)
    )
  )
}
