import { sha256 } from '@noble/hashes/sha2.js'
import { randomBytes } from '@noble/hashes/utils.js'
import { b64UrlEncode } from './base64'

export const challenge = {
  noble: {
    generateVerifier: () => b64UrlEncode(randomBytes(32)),
    generateCode: (verifier: string) => b64UrlEncode(sha256(new TextEncoder().encode(verifier))),
  },
  /**
   * @deprecated Use noble instead
   */
  crypto: {
    generateVerifier: () => b64UrlEncode(crypto.getRandomValues(new Uint8Array(32))),
    generateCode: async (verifier: string) => {
      const sha256 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
      return b64UrlEncode(new Uint8Array(sha256))
    },
  },
}
