// Browser/renderer-side encryption primitives built on Web Crypto (AES-GCM).
// Unlike `./encryption` (Node `node:crypto`, secret-derived key for server-side
// at-rest encryption), these operate on an already-managed `CryptoKey`, so the
// caller owns the key lifecycle (e.g. a non-extractable key in IndexedDB or one
// wrapped by the OS keychain).

const IV_LENGTH = 12

export function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

export function base64ToBytes(base64: string) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export async function encryptWithKey(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.byteLength)
  return bytesToBase64(combined)
}

export async function decryptWithKey(key: CryptoKey, encryptedText: string) {
  const bytes = base64ToBytes(encryptedText)
  return new TextDecoder().decode(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, IV_LENGTH) }, key, bytes.slice(IV_LENGTH)),
  )
}
