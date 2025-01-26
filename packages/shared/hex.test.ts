import { describe, expect, it } from 'vitest'
import { hexDecode, hexEncode } from './hex'

describe('hex', () => {
  it('hexEncode converts string to hex', () => {
    expect(hexEncode('Hello')).not.toBe('Hello')
  })

  it('encode and decode special characters', () => {
    const string = 'Special @#$% ! %^&*() / chars'

    expect(hexDecode(hexEncode(string))).toBe(string)
  })
})
