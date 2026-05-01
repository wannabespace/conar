import { describe, expect, it } from 'bun:test'
import { fromBase64, toBase64 } from './base64'

describe('toBase64 / fromBase64', () => {
  it('encodes and decodes basic ASCII correctly', () => {
    const input = 'hello world'
    const encoded = toBase64(input)
    const decoded = fromBase64(encoded)
    expect(decoded).toBe(input)
  })

  it('works with unicode characters', () => {
    const input = 'こんにちは世界🌏'
    const encoded = toBase64(input)
    const decoded = fromBase64(encoded)
    expect(decoded).toBe(input)
  })

  it('works with empty string', () => {
    const input = ''
    const encoded = toBase64(input)
    const decoded = fromBase64(encoded)
    expect(decoded).toBe(input)
  })

  it('preserves null chars and binary-like values', () => {
    const input = '\u0000abc\u0001\u0002'
    const encoded = toBase64(input)
    const decoded = fromBase64(encoded)
    expect(decoded).toBe(input)
  })
})
