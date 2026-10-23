import { describe, expect, it } from 'bun:test'

import { getLocalTime, isNumericColumn } from './utils'

const numeric = (type: string) =>
  isNumericColumn({ id: 'c', type, uiType: 'raw' })

describe('isNumericColumn', () => {
  it('matches numeric types across engines but not look-alikes', () => {
    expect(
      ['int4', 'UInt64', 'Decimal(10, 2)', 'double precision', 'money'].map(
        numeric
      )
    ).toEqual([true, true, true, true, true])
    expect(['interval', 'point', 'text', 'uuid'].map(numeric)).toEqual([
      false,
      false,
      false,
      false,
    ])
  })
})

describe('getLocalTime', () => {
  process.env.TZ = 'Europe/Kyiv'

  it.each([
    ['2026-10-20 12:00:00.123456+00', '15:00:00.123456'],
    ['2026-10-20 21:30:00 -05:00', '2026-10-21 05:30:00'],
    ['2026-01-20T12:00:00Z', '14:00:00'],
    ['2026-10-20 15:00:00+03', undefined],
    ['2026-10-20 12:00:00', undefined],
    ['2026-10-20', undefined],
    ['12:00', undefined],
  ])('shows %p as %p', (stored, local) => {
    expect(getLocalTime(stored)).toBe(local)
  })

  it('reads a time without a day as today', () => {
    expect(getLocalTime('09:15:00+00')).toMatch(/^1[12]:15:00$/u)
  })
})
