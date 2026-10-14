import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from './connection-parts'
import { toConnectionParts, toConnectionString } from './connection-parts'
import { parseConnectionString } from './parse-connection-string'

const parts = (overrides: Partial<ConnectionParts>): ConnectionParts => ({
  database: 'app',
  host: 'db.acme.io',
  https: null,
  options: '',
  password: 'pw',
  port: '5432',
  ssh: null,
  type: ConnectionType.Postgres,
  user: 'me',
  ...overrides,
})

const VALUES = [
  'p w',
  'a?b',
  'a#b',
  '100%',
  'foo%3Fbar',
  'me@srv',
  'a/b',
  'пароль 🔑',
]

describe('toConnectionString', () => {
  it.each(VALUES)('hands %p to the driver as typed', (value) => {
    expect(
      parseConnectionString(
        toConnectionString(
          parts({ database: value, password: value, user: value })
        )
      )
    ).toMatchObject({ database: value, password: value, user: value })
  })

  it.each(VALUES)('reads %p back into the same parts', (value) => {
    const original = parts({
      database: value,
      options: 'sslmode=require',
      password: value,
      user: value,
    })
    expect(toConnectionParts(toConnectionString(original))).toStrictEqual(
      original
    )
  })

  it.each(['::1', 'fe80::1', '2001:db8::5'])(
    'brackets the IPv6 host %p',
    (host) => {
      const connectionString = toConnectionString(parts({ host }))
      expect(connectionString).toContain(`[${host}]`)
      expect(parseConnectionString(connectionString).host).toBe(host)
    }
  )

  it.each([
    [true, '9443', 'https://me:pw@ch.acme.io:9443/logs'],
    [false, '8443', 'http://me:pw@ch.acme.io:8443/logs'],
    [null, '8443', 'https://me:pw@ch.acme.io:8443/logs'],
    [null, '8123', 'http://me:pw@ch.acme.io:8123/logs'],
  ])(
    'keeps ClickHouse on https=%p over port %p',
    (https, port, connectionString) => {
      const clickhouse = parts({
        database: 'logs',
        host: 'ch.acme.io',
        https,
        port,
        type: ConnectionType.ClickHouse,
      })
      expect(toConnectionString(clickhouse)).toBe(connectionString)
    }
  )
})
