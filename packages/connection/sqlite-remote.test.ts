import { describe, expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { connectionParts } from './connection-parts'
import { describeConnectionString, resourceConnectionString } from './utils'

describe('remote SQLite strings', () => {
  test('keeps a libSQL token in the password', () => {
    const parts = connectionParts.parse(
      'libsql://shop-acme.turso.io?authToken=tok.en'
    )

    expect(parts).toMatchObject({
      host: 'shop-acme.turso.io',
      options: '',
      password: 'tok.en',
      type: ConnectionType.SQLite,
    })
    expect(connectionParts.format(parts)).toBe(
      'libsql://:tok.en@shop-acme.turso.io'
    )
  })

  test('reads a D1 string back into its IDs', () => {
    const connectionString = 'd1://acc:tok@api.cloudflare.com/db-id'
    const parts = connectionParts.parse(connectionString)

    expect(parts).toMatchObject({
      database: 'db-id',
      host: 'api.cloudflare.com',
      password: 'tok',
      type: ConnectionType.SQLite,
      user: 'acc',
    })
    expect(connectionParts.format(parts)).toBe(connectionString)
  })

  test('opens as the single database main and shows where it lives', () => {
    const turso = 'libsql://:tok@shop-acme.turso.io'
    const d1 = 'd1://acc:tok@api.cloudflare.com/db-id'

    expect(resourceConnectionString(turso, 'main')).toBe(turso)
    expect(describeConnectionString(turso)).toMatchObject({
      defaultResourceName: 'main',
      displayUrl: 'shop-acme.turso.io',
      isInternal: false,
    })
    expect(describeConnectionString(d1)).toMatchObject({
      defaultResourceName: 'main',
      displayUrl: 'db-id',
    })
  })
})
