export function generateRandomString(length: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

export async function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

export function base64URLEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generateCodeChallenge(verifier: string) {
  const hashed = await sha256(verifier)
  return base64URLEncode(hashed)
}
