import { describe, expect, it } from 'bun:test'
import { createPostgresListTransformer } from './postgres'

describe('createPostgresListTransformer', () => {
  const t = createPostgresListTransformer()

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
})
