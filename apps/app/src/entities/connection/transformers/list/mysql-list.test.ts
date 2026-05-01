import { describe, expect, it } from 'bun:test'
import { createMysqlListTransformer } from './mysql'

describe('createMysqlListTransformer', () => {
  const t = createMysqlListTransformer()

  describe('fromConnection → toUI', () => {
    it('parses comma-separated SET values into string[]', () => {
      expect(t.fromConnection('a,b,c').toUI()).toEqual(['a', 'b', 'c'])
    })

    it('normalizes array values from the driver to string[]', () => {
      expect(t.fromConnection(['x', 'y']).toUI()).toEqual(['x', 'y'])
    })

    it('returns [] for null, undefined, and empty string', () => {
      expect(t.fromConnection(null).toUI()).toEqual([])
      expect(t.fromConnection(undefined).toUI()).toEqual([])
      expect(t.fromConnection('').toUI()).toEqual([])
    })

    it('parses JSON array string input', () => {
      expect(t.fromConnection('["a","b"]').toUI()).toEqual(['a', 'b'])
    })

    it('wraps a single value without commas as one element', () => {
      expect(t.fromConnection('solo').toUI()).toEqual(['solo'])
    })

    it('trims whitespace around comma-separated items', () => {
      expect(t.fromConnection('a , b , c').toUI()).toEqual(['a', 'b', 'c'])
    })
  })

  describe('fromConnection → toRaw', () => {
    it('joins parsed values with commas', () => {
      expect(t.fromConnection('a,b,c').toRaw()).toBe('a,b,c')
      expect(t.fromConnection('["a","b"]').toRaw()).toBe('a,b')
    })

    it('returns empty string for an empty list', () => {
      expect(t.fromConnection('').toRaw()).toBe('')
    })

    it('joins array connection values with commas', () => {
      expect(t.fromConnection(['a', 'b']).toRaw()).toBe('a,b')
      expect(t.fromConnection([]).toRaw()).toBe('')
    })
  })

  describe('toConnection.fromRaw', () => {
    it('passes through the raw editor string', () => {
      expect(t.toConnection.fromRaw('a,b,c')).toBe('a,b,c')
      expect(t.toConnection.fromRaw('plain')).toBe('plain')
    })
  })

  describe('toConnection.fromUI', () => {
    it('joins UI string[] to comma-separated SET text', () => {
      expect(t.toConnection.fromUI(['a', 'b', 'c'])).toBe('a,b,c')
    })

    it('returns empty string for an empty array', () => {
      expect(t.toConnection.fromUI([])).toBe('')
    })
  })

  describe('fromConnection ⟷ toConnection.fromUI', () => {
    it('round-trips representative string connection values', () => {
      const samples = ['a,b,c', '["x","y"]', 'solo', ''] as const

      for (const raw of samples) {
        const ui = t.fromConnection(raw).toUI()
        expect(t.toConnection.fromUI(ui)).toBe(t.fromConnection(raw).toRaw())
      }
    })
  })
})
