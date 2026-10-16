import { sha256 } from '@noble/hashes/sha2.js'
import { randomBytes } from '@noble/hashes/utils.js'

import { b64UrlEncode } from './base64'

export const challenge = {
  generateCode: (verifier: string) =>
    b64UrlEncode(sha256(new TextEncoder().encode(verifier))),
  generateVerifier: () => b64UrlEncode(randomBytes(32)),
}
