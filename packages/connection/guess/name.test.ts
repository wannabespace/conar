import { describe, expect, it } from 'bun:test'

import { suggestConnectionName } from './name'

describe('suggestConnectionName', () => {
  it.each([
    ['db.acme.io', 'app', 'acme · app'],
    ['www.acme.io', '', 'acme'],
    ['db.abcd.supabase.co', 'postgres', 'Supabase · postgres'],
    ['localhost', 'shop', 'Local · shop'],
    ['127.0.0.1', '', 'Local'],
    ['10.0.0.5', 'app', '10.0.0.5 · app'],
  ])('names %s / %s as %s', (host, database, name) => {
    expect(suggestConnectionName({ database, host })).toBe(name)
  })

  it('has no name without a host', () => {
    expect(suggestConnectionName({ database: 'app', host: '' })).toBeNull()
  })
})
