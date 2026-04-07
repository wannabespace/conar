import { describe, expect, it } from 'bun:test'
import { createClickHouseListTransformer } from './clickhouse'

describe('createClickHouseListTransformer', () => {
  const t = createClickHouseListTransformer()

  describe('toEditable', () => {
    it('should convert JS array to pretty JSON', () => {
      expect(t.toEditable(['a', 'b'])).toBe('[\n  "a",\n  "b"\n]')
    })

    it('should return empty array JSON for null', () => {
      expect(t.toEditable(null)).toBe('[]')
    })

    it('should return empty array JSON for empty string', () => {
      expect(t.toEditable('')).toBe('[]')
    })

    it('should parse JSON array string input', () => {
      expect(t.toEditable('["x","y"]')).toBe('[\n  "x",\n  "y"\n]')
    })

    it('should wrap non-array string as single element', () => {
      expect(t.toEditable('solo')).toBe('[\n  "solo"\n]')
    })
  })

  describe('toDb', () => {
    it('should return JS string array from JSON array input', () => {
      expect(t.toDb('["a","b","c"]')).toEqual(['a', 'b', 'c'])
    })

    it('should return empty array for empty input', () => {
      expect(t.toDb('[]')).toEqual([])
    })

    it('should stringify numeric elements', () => {
      expect(t.toDb('[1,2,3]')).toEqual(['1', '2', '3'])
    })

    it('should fall back to wrapping invalid JSON as single-element array', () => {
      expect(t.toDb('plain')).toEqual(['plain'])
    })
  })
})
