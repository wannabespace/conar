import { describe, expect, it } from 'bun:test'
import { createPostgresListTransformer } from './postgres'

describe('createPostgresListTransformer', () => {
  const t = createPostgresListTransformer()

  describe('toDisplay', () => {
    it('should stringify arrays', () => {
      expect(t.toDisplay(['a', 'b', 'c'], 200)).toBe('[\"a\",\"b\",\"c\"]')
    })

    it('should show null for null', () => {
      expect(t.toDisplay(null, 200)).toBe('null')
    })

    it('should show empty for empty string', () => {
      expect(t.toDisplay('', 200)).toBe('empty')
    })

    it('should truncate long values', () => {
      const longArray = Array.from({ length: 200 }, (_, i) => `item${i}`)
      const result = t.toDisplay(longArray, 60)
      expect(result.length).toBeLessThan(JSON.stringify(longArray).length)
    })
  })

  describe('toEditable', () => {
    it('should convert JS array to pretty JSON', () => {
      expect(t.toEditable(['a', 'b'])).toBe('[\n  "a",\n  "b"\n]')
    })

    it('should return empty array JSON for null', () => {
      expect(t.toEditable(null)).toBe('[]')
    })

    it('should return empty array JSON for undefined', () => {
      expect(t.toEditable(undefined)).toBe('[]')
    })

    it('should return empty array JSON for empty string', () => {
      expect(t.toEditable('')).toBe('[]')
    })

    it('should parse PG array literal string', () => {
      expect(t.toEditable('{a,b,c}')).toBe('[\n  "a",\n  "b",\n  "c"\n]')
    })

    it('should parse empty PG array literal', () => {
      expect(t.toEditable('{}')).toBe('[]')
    })

    it('should parse JSON array string', () => {
      expect(t.toEditable('["x","y"]')).toBe('[\n  "x",\n  "y"\n]')
    })

    it('should wrap non-string non-array in array', () => {
      expect(t.toEditable(42)).toBe('[\n  "42"\n]')
    })

    it('should wrap plain string in array', () => {
      expect(t.toEditable('hello')).toBe('[\n  "hello"\n]')
    })
  })

  describe('toDb', () => {
    it('should convert JSON array to PG literal', () => {
      expect(t.toDb('["a","b","c"]')).toBe('{a,b,c}')
    })

    it('should produce empty PG array for empty JSON array', () => {
      expect(t.toDb('[]')).toBe('{}')
    })

    it('should quote values containing commas', () => {
      expect(t.toDb('["a,b","c"]')).toBe('{"a,b",c}')
    })

    it('should quote values containing double quotes', () => {
      expect(t.toDb('["say \\"hi\\"","ok"]')).toBe('{"say \\"hi\\"",ok}')
    })

    it('should quote values containing backslashes', () => {
      expect(t.toDb('["a\\\\b","c"]')).toBe('{"a\\\\b",c}')
    })

    it('should quote values containing curly braces', () => {
      expect(t.toDb('["{nested}","plain"]')).toBe('{"{nested}",plain}')
    })

    it('should quote values containing whitespace', () => {
      expect(t.toDb('["hello world","ok"]')).toBe('{"hello world",ok}')
    })

    it('should quote the string NULL (case-insensitive)', () => {
      expect(t.toDb('["NULL","null","Null"]')).toBe('{"NULL","null","Null"}')
    })

    it('should double-quote empty strings', () => {
      expect(t.toDb('["","a"]')).toBe('{"",a}')
    })

    it('should fall back to wrapping invalid JSON as single-element array', () => {
      expect(t.toDb('not json')).toBe('{"not json"}')
    })
  })

  describe('toRaw', () => {
    it('should return string values as-is', () => {
      expect(t.toRaw('{a,b,c}')).toBe('{a,b,c}')
    })

    it('should JSON.stringify non-string values', () => {
      expect(t.toRaw(['a', 'b'])).toBe('[\n  "a",\n  "b"\n]')
    })
  })

  describe('parseEditableToList', () => {
    it('should parse JSON array string into string[]', () => {
      expect(t.parseEditableToList('["a","b","c"]')).toEqual(['a', 'b', 'c'])
    })

    it('should convert numeric JSON array elements to strings', () => {
      expect(t.parseEditableToList('[1,2,3]')).toEqual(['1', '2', '3'])
    })

    it('should fall back to single-element array for invalid JSON', () => {
      expect(t.parseEditableToList('hello')).toEqual(['hello'])
    })

    it('should parse empty JSON array', () => {
      expect(t.parseEditableToList('[]')).toEqual([])
    })
  })
})
