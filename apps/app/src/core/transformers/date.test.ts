import { describe, expect, it } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'

import { getCapabilities } from '~/core/catalog/capabilities'

import { createDateTransformer } from './date'

const column = {
  id: 'created_at',
  isNullable: true,
  type: 'timestamp with time zone',
  uiType: 'datetime',
} as const

describe('createDateTransformer', () => {
  const t = createDateTransformer(
    column,
    getCapabilities(Dialect.Postgres).columnTypes.dateKeywords
  )

  it('accepts what engines print and parse', () => {
    for (const text of [
      '2026-08-23',
      '2026-08-23 14:16',
      '2026-08-23 14:16:11.959+00',
      '2026-08-23T14:16:11Z',
      '2026-08-23 14:16:11.1234567 +05:30',
      '0044-03-15 BC',
      '-infinity',
      'now',
    ]) {
      expect(t.toConnection.fromRaw(` ${text} `)).toBe(text)
    }
  })

  it('rejects text that is not a date', () => {
    expect(() =>
      t.toConnection.fromRaw('2026-08-23 14:16:11.959+00qax')
    ).toThrow('Enter a date and time like 2026-08-23 14:30:00')
  })

  it('rejects date words on an engine that does not read them', () => {
    const clickhouse = createDateTransformer(
      column,
      getCapabilities(Dialect.ClickHouse).columnTypes.dateKeywords
    )
    expect(() => clickhouse.toConnection.fromRaw('yesterday')).toThrow(
      'Enter a date and time like 2026-08-23 14:30:00'
    )
  })

  it('turns empty text into null for a nullable column', () => {
    expect(t.toConnection.fromRaw('')).toBeNull()
  })
})
