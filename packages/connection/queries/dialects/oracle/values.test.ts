import { describe, expect, it } from 'bun:test'

import type * as OracleDb from 'oracledb'

import { oracledb } from './client'
import { bindable, fetchTypeHandler } from './values'

const read = (dbType: OracleDb.DbType, value: unknown) =>
  fetchTypeHandler({ dbType })?.converter?.(value) ?? value

describe('reading Oracle values', () => {
  it.each([
    ['an integer', '42', 42],
    ['a decimal JS keeps exactly', '0.1', 0.1],
    [
      'a NUMBER past double precision',
      '12345678901234567890',
      '12345678901234567890',
    ],
    [
      'a decimal past double precision',
      '0.12345678901234567891',
      '0.12345678901234567891',
    ],
  ])('reads %s', (_, text, value) => {
    expect(read(oracledb.DB_TYPE_NUMBER, text)).toBe(value)
  })

  it('reads DATE and TIMESTAMP as their wall-clock text', () => {
    const date = new Date(2024, 0, 2, 3, 4, 5, 6)
    expect(read(oracledb.DB_TYPE_DATE, date)).toBe('2024-01-02 03:04:05')
    expect(read(oracledb.DB_TYPE_TIMESTAMP, date)).toBe(
      '2024-01-02 03:04:05.006'
    )
  })

  it('reads zoned timestamps as UTC, the local one without an offset', () => {
    const instant = new Date(Date.UTC(2024, 0, 1, 21, 34, 5, 123))
    expect(read(oracledb.DB_TYPE_TIMESTAMP_TZ, instant)).toBe(
      '2024-01-01 21:34:05.123 +00:00'
    )
    expect(read(oracledb.DB_TYPE_TIMESTAMP_LTZ, instant)).toBe(
      '2024-01-01 21:34:05.123'
    )
  })

  it('reads intervals in the text Oracle takes back', () => {
    expect(
      read(
        oracledb.DB_TYPE_INTERVAL_DS,
        Object.assign(new oracledb.IntervalDS(), {
          days: 1,
          fseconds: 500_000_000,
          hours: 2,
          minutes: 3,
          seconds: 4,
        })
      )
    ).toBe('1 02:03:04.5')
    expect(
      read(
        oracledb.DB_TYPE_INTERVAL_YM,
        Object.assign(new oracledb.IntervalYM(), { months: 2, years: 1 })
      )
    ).toBe('1-2')
  })
})

describe('binding Oracle values', () => {
  it.each([
    ['a boolean as a number', true, 1],
    ['a bigint as text', 10n, '10'],
    ['a missing value as NULL', undefined, null],
  ])('binds %s', (_, value, bound) => {
    expect(bindable(value)).toBe(bound)
  })

  it('binds bytes as a Buffer, not text', () => {
    expect(Buffer.isBuffer(bindable(new Uint8Array([1, 2])))).toBe(true)
  })
})
