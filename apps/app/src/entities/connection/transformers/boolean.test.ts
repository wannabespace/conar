import { describe, expect, it } from 'bun:test'
import { createBooleanTransformer } from './boolean'

describe('createBooleanTransformer', () => {
  const t = createBooleanTransformer()

  describe('fromConnection → toUI', () => {
    it('returns false for null and undefined', () => {
      expect(t.fromConnection(null).toUI()).toBe(false)
      expect(t.fromConnection(undefined).toUI()).toBe(false)
    })

    it('returns boolean primitives as-is', () => {
      expect(t.fromConnection(true).toUI()).toBe(true)
      expect(t.fromConnection(false).toUI()).toBe(false)
    })

    it('maps 1 / 0 like MySQL tinyint', () => {
      expect(t.fromConnection(1).toUI()).toBe(true)
      expect(t.fromConnection(0).toUI()).toBe(false)
    })

    it('coerces other values with Boolean()', () => {
      expect(t.fromConnection('yes').toUI()).toBe(true)
      expect(t.fromConnection('').toUI()).toBe(false)
    })
  })

  describe('fromConnection → toRaw', () => {
    it('uses getValueForEditor for the raw view', () => {
      expect(t.fromConnection(true).toRaw()).toBe('true')
      expect(t.fromConnection(false).toRaw()).toBe('false')
      expect(t.fromConnection(null).toRaw()).toBe('')
    })
  })

  describe('toConnection.fromUI', () => {
    it('passes through the boolean sent from the UI', () => {
      expect(t.toConnection.fromUI(true)).toBe(true)
      expect(t.toConnection.fromUI(false)).toBe(false)
    })
  })

  describe('toConnection.fromRaw', () => {
    it('passes through raw editor text', () => {
      expect(t.toConnection.fromRaw('true')).toBe('true')
      expect(t.toConnection.fromRaw('false')).toBe('false')
    })
  })
})
