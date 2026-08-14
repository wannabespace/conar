import { sha256 } from '@noble/hashes/sha2.js'
import { randomBytes } from '@noble/hashes/utils.js'

import { b64UrlEncode } from './base64'

export const challenge = {
  /**
   * @deprecated Use noble instead
   */
  crypto: {
    generateCode: async (verifier: string) => {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(verifier)
      )
      return b64UrlEncode(new Uint8Array(digest))
    },
    generateVerifier: () =>
      b64UrlEncode(crypto.getRandomValues(new Uint8Array(32))),
  },
  noble: {
    generateCode: (verifier: string) =>
      b64UrlEncode(sha256(new TextEncoder().encode(verifier))),
    generateVerifier: () => b64UrlEncode(randomBytes(32)),
  },
}
