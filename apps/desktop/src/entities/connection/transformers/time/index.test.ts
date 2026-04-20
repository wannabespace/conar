import type { Column } from '../../components'
import { describe, expect, it } from 'bun:test'
import { createTimeTransformer } from '.'

describe('createTimeTransformer', () => {
  const column: Column = {
    id: 'start_at',
    uiType: 'time',
    type: 'time',
    isNullable: true,
  }
  const t = createTimeTransformer(column)

  describe('fromConnection → toRaw', () => {
    it('matches the UI string', () => {
      expect(t.fromConnection(' 23:59:59 ').toRaw()).toBe('23:59:59')
      expect(t.fromConnection(null).toRaw()).toBe('')
    })

    it('handles Date objects', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      expect(t.fromConnection(date).toRaw()).toBe('12:00:00')
    })

    it('handles ISO strings', () => {
      const iso = '2023-01-01T12:00:00.000Z'
      expect(t.fromConnection(iso).toRaw()).toBe('12:00:00')
    })
  })

  describe('toConnection.fromRaw', () => {
    it('returns the trimmed string', () => {
      expect(t.toConnection.fromRaw(' 9:15 ')).toBe('9:15')
    })

    it('converts an empty string to null for nullable columns', () => {
      expect(t.toConnection.fromRaw('')).toBeNull()
    })
  })
})
