import { describe, expect, it } from 'bun:test'

import { createJsonTransformer, createUuidTransformer } from './raw'

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
  })
})

describe('createUuidTransformer', () => {
  const t = createUuidTransformer()

  it('accepts the spellings engines parse', () => {
    for (const uuid of [
      '01a02ef9-5d4f-72ba-8c04-0f6e8e450727',
      '01A02EF95D4F72BA8C040F6E8E450727',
      '{01a02ef9-5d4f-72ba-8c04-0f6e8e450727}',
    ]) {
      expect(t.toConnection.fromRaw(` ${uuid} `)).toBe(uuid)
    }
  })

  it('rejects text that is not a uuid', () => {
    expect(() => t.toConnection.fromRaw('qa_pasted')).toThrow('Enter a UUID')
  })
})
