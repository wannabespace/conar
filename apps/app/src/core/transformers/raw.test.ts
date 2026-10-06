import { describe, expect, it } from 'bun:test'

import { createJsonTransformer } from './raw'

describe('createJsonTransformer', () => {
  const t = createJsonTransformer()

  it('keeps the quotes of a string scalar for the editor', () => {
    expect(t.fromConnection('dark').toRaw()).toBe('"dark"')
  })

  it('parses valid json and rejects invalid json', () => {
    expect(t.toConnection.fromRaw('{"a": 1}')).toEqual({ a: 1 })
    expect(() => t.toConnection.fromRaw('{bad')).toThrow('Invalid JSON')
  })

  it('round-trips a string scalar through the editor text', () => {
    const parsed = t.toConnection.fromRaw(t.fromConnection('dark').toRaw())
    expect(parsed).toBe('dark')
    expect(t.toStatement?.(parsed)).toBe('"dark"')
  })

  it('binds NULL as is, not as json null', () => {
    expect(t.toStatement?.(null)).toBeNull()
  })
})
