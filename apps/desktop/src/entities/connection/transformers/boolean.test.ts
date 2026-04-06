import { describe, expect, it } from 'bun:test'
import { createBooleanTransformer } from './boolean'

describe('createBooleanTransformer', () => {
  const t = createBooleanTransformer()

  describe('toEditable', () => {
    it('should return empty string for null', () => {
      expect(t.toEditable(null)).toBe('')
    })

    it('should return empty string for undefined', () => {
      expect(t.toEditable(undefined)).toBe('')
    })

    it('should return "true" for boolean true', () => {
      expect(t.toEditable(true)).toBe('true')
    })

    it('should return "false" for boolean false', () => {
      expect(t.toEditable(false)).toBe('false')
    })

    it('should return "true" for number 1 (MySQL tinyint)', () => {
      expect(t.toEditable(1)).toBe('true')
    })

    it('should return "false" for number 0 (MySQL tinyint)', () => {
      expect(t.toEditable(0)).toBe('false')
    })

    it('should return string representation for other values', () => {
      expect(t.toEditable('yes')).toBe('yes')
    })
  })

  describe('toDb', () => {
    it('should pass through "true"', () => {
      expect(t.toDb('true')).toBe('true')
    })

    it('should pass through "false"', () => {
      expect(t.toDb('false')).toBe('false')
    })

    it('should pass through empty string', () => {
      expect(t.toDb('')).toBe('')
    })
  })
})
