import { describe, expect, it } from 'bun:test'
import { createClickHouseListTransformer } from './clickhouse'

describe('createClickHouseListTransformer', () => {
  const t = createClickHouseListTransformer()

  describe('fromConnection → toUI', () => {
    it('normalizes JS array input to string[]', () => {
      expect(t.fromConnection(['a', 'b'] as unknown as string).toUI()).toEqual(['a', 'b'])
    })

    it('returns [] for null, undefined, and empty string', () => {
      expect(t.fromConnection(null as unknown as string).toUI()).toEqual([])
      expect(t.fromConnection(undefined as unknown as string).toUI()).toEqual([])
      expect(t.fromConnection('').toUI()).toEqual([])
    })

    it('parses JSON array string input', () => {
      expect(t.fromConnection('["x","y"]').toUI()).toEqual(['x', 'y'])
    })

    it('wraps a non-array string as a single element', () => {
      expect(t.fromConnection('solo').toUI()).toEqual(['solo'])
    })
  })

  describe('fromConnection → toRaw', () => {
    it('returns the connection string unchanged when it is already a string', () => {
      expect(t.fromConnection('["x","y"]').toRaw()).toBe('["x","y"]')
      expect(t.fromConnection('solo').toRaw()).toBe('solo')
    })

    it('JSON-stringifies array (and other non-string) values for the raw editor', () => {
      expect(t.fromConnection(['a', 'b']).toRaw()).toBe('["a","b"]')
      expect(t.fromConnection([]).toRaw()).toBe('[]')
    })

    it('returns empty string for an empty connection string', () => {
      expect(t.fromConnection('').toRaw()).toBe('')
    })
  })

  describe('toConnection.fromRaw', () => {
    it('parses JSON array text to string[]', () => {
      expect(t.toConnection.fromRaw('["a","b","c"]')).toEqual(['a', 'b', 'c'])
    })

    it('returns [] for empty input', () => {
      expect(t.toConnection.fromRaw('')).toEqual([])
    })

    it('stringifies numeric JSON elements', () => {
      expect(t.toConnection.fromRaw('[1,2,3]')).toEqual(['1', '2', '3'])
    })

    it('wraps non-JSON text as a single element', () => {
      expect(t.toConnection.fromRaw('plain')).toEqual(['plain'])
    })

    it('throws on malformed JSON array input', () => {
      expect(() => t.toConnection.fromRaw('[\"1\", \'2\']')).toThrow('Invalid JSON array format')
      expect(() => t.toConnection.fromRaw('[1, 2,]')).toThrow('Invalid JSON array format')
    })
  })

  describe('toConnection.fromUI', () => {
    it('passes UI string[] through unchanged', () => {
      expect(t.toConnection.fromUI(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('returns [] for an empty array', () => {
      expect(t.toConnection.fromUI([])).toEqual([])
    })
  })

  describe('fromConnection ⟷ parse path', () => {
    it('fromRaw(toRaw(v)) equals toUI(v) when v is a JSON array string', () => {
      const v = '["a","b"]'
      const raw = t.fromConnection(v).toRaw()
      expect(typeof raw).toBe('string')
      expect(t.toConnection.fromRaw(raw as string)).toEqual(t.fromConnection(v).toUI())
    })

    it('fromUI(toUI(v)) equals toUI(v)', () => {
      const samples = ['["a","b"]', 'solo', ''] as const
      for (const v of samples) {
        const ui = t.fromConnection(v).toUI()
        expect(t.toConnection.fromUI(ui)).toEqual(ui)
      }
    })
  })
})
