import { b64UrlEncode } from './base64'

export function generateVerifier() {
  return b64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
}

export async function generateCodeChallenge(verifier: string) {
  const sha256 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64UrlEncode(new Uint8Array(sha256))
}
