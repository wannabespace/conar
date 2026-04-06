import { describe, expect, it } from 'bun:test'
import { createMysqlListTransformer } from './mysql'

describe('createMysqlListTransformer', () => {
  const t = createMysqlListTransformer()

  describe('toEditable', () => {
    it('should parse comma-separated SET value', () => {
      expect(t.toEditable('a,b,c')).toBe('[\n  "a",\n  "b",\n  "c"\n]')
    })

    it('should handle JS array input', () => {
      expect(t.toEditable(['x', 'y'])).toBe('[\n  "x",\n  "y"\n]')
    })

    it('should return empty array JSON for null', () => {
      expect(t.toEditable(null)).toBe('[]')
    })

    it('should return empty array JSON for empty string', () => {
      expect(t.toEditable('')).toBe('[]')
    })

    it('should parse JSON array string', () => {
      expect(t.toEditable('["a","b"]')).toBe('[\n  "a",\n  "b"\n]')
    })

    it('should wrap single value in array', () => {
      expect(t.toEditable('solo')).toBe('[\n  "solo"\n]')
    })

    it('should trim whitespace around comma-separated items', () => {
      expect(t.toEditable('a , b , c')).toBe('[\n  "a",\n  "b",\n  "c"\n]')
    })
  })

  describe('toDb', () => {
    it('should convert JSON array to comma-separated string', () => {
      expect(t.toDb('["a","b","c"]')).toBe('a,b,c')
    })

    it('should return empty string for empty JSON array', () => {
      expect(t.toDb('[]')).toBe('')
    })

    it('should fall back to raw value for invalid JSON', () => {
      expect(t.toDb('plain')).toBe('plain')
    })

    it('should stringify numeric elements', () => {
      expect(t.toDb('[1,2,3]')).toBe('1,2,3')
    })
  })
})
