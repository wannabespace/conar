import type { Column } from '../../components/table/cell/utils'
import { describe, expect, it } from 'bun:test'
import { createPostgresListTransformer } from './postgres'

const enumColumn: Column = { id: 'status', uiType: 'list', isArray: true, enumName: 'status_enum', availableValues: ['a', 'b', 'c'] }
const arrayColumn: Column = { id: 'tags', uiType: 'list', isArray: true }

describe('createPostgresListTransformer (enum — brace literal)', () => {
  const t = createPostgresListTransformer(enumColumn)

  describe('fromConnection → toUI', () => {
    it('returns [] for null, undefined, and empty string', () => {
      expect(t.fromConnection(null).toUI()).toEqual([])
      expect(t.fromConnection(undefined).toUI()).toEqual([])
      expect(t.fromConnection('').toUI()).toEqual([])
    })

    it('parses a PostgreSQL array literal into string[]', () => {
      expect(t.fromConnection('{a,b,c}').toUI()).toEqual(['a', 'b', 'c'])
      expect(t.fromConnection('{ a , b }').toUI()).toEqual(['a', 'b'])
    })

    it('parses double-quoted elements with commas', () => {
      expect(t.fromConnection('{"a,b",c}').toUI()).toEqual(['a,b', 'c'])
    })

    it('unescapes \\" and \\\\ inside quoted elements', () => {
      expect(t.fromConnection('{"say \\"hi\\"",x}').toUI()).toEqual(['say "hi"', 'x'])
    })

    it('parses a JSON array string before trying brace literals', () => {
      expect(t.fromConnection('["json","array"]').toUI()).toEqual(['json', 'array'])
    })

    it('wraps a non-literal, non-JSON string as a single element', () => {
      expect(t.fromConnection('hello').toUI()).toEqual(['hello'])
    })

    it('returns a single element when the value is not a brace-wrapped literal', () => {
      expect(t.fromConnection('{incomplete').toUI()).toEqual(['{incomplete'])
    })
  })

  describe('fromConnection → toRaw', () => {
    it('returns the string value as-is', () => {
      expect(t.fromConnection('{a,b,c}').toRaw()).toBe('{a,b,c}')
      expect(t.fromConnection('{"a,b",c}').toRaw()).toBe('{"a,b",c}')
    })

    it('returns empty string for null', () => {
      expect(t.fromConnection(null).toRaw()).toBe('')
    })

    it('returns JSON stringified value for non-string values', () => {
      expect(t.fromConnection(['x', 'y']).toRaw()).toBe('["x","y"]')
    })
  })

  describe('toConnection.fromRaw', () => {
    it('returns the raw value as-is for enum columns', () => {
      expect(t.toConnection.fromRaw('{a,b}')).toBe('{a,b}')
      expect(t.toConnection.fromRaw('{"a,b",c}')).toBe('{"a,b",c}')
    })

    it('passes through JSON array text', () => {
      expect(t.toConnection.fromRaw('["a","b"]')).toBe('["a","b"]')
    })

    it('passes through plain string', () => {
      expect(t.toConnection.fromRaw('solo')).toBe('solo')
    })

    it('passes through empty input', () => {
      expect(t.toConnection.fromRaw('')).toBe('')
    })
  })

  describe('toConnection.fromUI', () => {
    it('serializes a UI string[] to a brace literal', () => {
      expect(t.toConnection.fromUI(['a', 'b'])).toBe('{a,b}')
    })

    it('returns {} for an empty array', () => {
      expect(t.toConnection.fromUI([])).toBe('{}')
    })
  })

  describe('round-trip', () => {
    it('round-trips representative connection values', () => {
      const samples = ['{a,b}', '{"a,b",c}', '{}', '["a","b","c"]', '{""}', '{"NULL"}'] as const

      for (const raw of samples) {
        const parsed = t.fromConnection(raw).toRaw()
        const result = t.toConnection.fromRaw(parsed)
        expect(result).toBe(parsed)
      }
    })
  })
})

describe('createPostgresListTransformer (plain array — JSON)', () => {
  const t = createPostgresListTransformer(arrayColumn)

  describe('fromConnection → toUI', () => {
    it('returns [] for all inputs (plain arrays have no UI)', () => {
      expect(t.fromConnection(null).toUI()).toEqual([])
      expect(t.fromConnection(undefined).toUI()).toEqual([])
      expect(t.fromConnection('').toUI()).toEqual([])
      expect(t.fromConnection('{a,b,c}').toUI()).toEqual([])
      expect(t.fromConnection('["x","y"]').toUI()).toEqual([])
    })
  })

  describe('fromConnection → toRaw', () => {
    it('returns JSON stringified value for all values', () => {
      expect(t.fromConnection('{a,b,c}').toRaw()).toBe('"{a,b,c}"')
      expect(t.fromConnection('["x","y"]').toRaw()).toBe('"[\\"x\\",\\"y\\"]"')
      expect(t.fromConnection('plain').toRaw()).toBe('"plain"')
    })

    it('returns empty string for null', () => {
      expect(t.fromConnection(null).toRaw()).toBe('')
    })

    it('returns JSON stringified array for arrays', () => {
      expect(t.fromConnection(['a', 'b']).toRaw()).toBe('["a","b"]')
      expect(t.fromConnection([]).toRaw()).toBe('[]')
    })
  })

  describe('toConnection.fromRaw', () => {
    it('parses JSON array text to an array', () => {
      expect(t.toConnection.fromRaw('["a","b"]')).toEqual(['a', 'b'])
    })

    it('throws on invalid JSON (brace literals are not valid JSON)', () => {
      expect(() => t.toConnection.fromRaw('{a,b}')).toThrow()
    })

    it('throws on non-JSON strings', () => {
      expect(() => t.toConnection.fromRaw('solo')).toThrow()
    })

    it('throws on empty input', () => {
      expect(() => t.toConnection.fromRaw('')).toThrow()
    })

    it('throws on malformed JSON array input', () => {
      expect(() => t.toConnection.fromRaw('[\"1\", \'2\']')).toThrow()
      expect(() => t.toConnection.fromRaw('[1, 2,]')).toThrow()
    })
  })

  describe('toConnection.fromUI', () => {
    it('throws Invalid value (plain arrays have no UI support)', () => {
      expect(() => t.toConnection.fromUI(['a', 'b'])).toThrow('Invalid value')
    })

    it('throws Invalid value for empty array', () => {
      expect(() => t.toConnection.fromUI([])).toThrow('Invalid value')
    })
  })

  describe('fromConnection → toRaw → fromRaw round-trip', () => {
    it('round-trips JSON array values', () => {
      const samples = ['["a","b","c"]'] as const

      for (const raw of samples) {
        const rawOutput = t.fromConnection(raw).toRaw()
        const fromRawResult = t.toConnection.fromRaw(rawOutput)
        expect(fromRawResult).toEqual(JSON.parse(rawOutput))
      }
    })
  })
})
