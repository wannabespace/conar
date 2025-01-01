import { describe, expect, it } from 'vitest'
import { decodeBase64, encodeBase64 } from './base64'

describe('base64', () => {
  it('should encode and decode', () => {
    const encoded = encodeBase64('hello')

    expect(encoded).toBe('aGVsbG8=')

    const decoded = decodeBase64(encoded)

    expect(decoded).toBe('hello')
  })
})
