import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

describe('guessConnection — libpq key=value', () => {
  it('reads a conninfo string, quoted values and unknown keys included', () => {
    expect(
      guessConnection(
        "host=localhost port=5432 dbname=app user=me password='a b$c' sslmode=require"
      )
    ).toStrictEqual({
      fixes: [],
      format: 'key-value',
      parts: {
        database: 'app',
        host: 'localhost',
        options: 'sslmode=require',
        password: 'a b$c',
        port: '5432',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    })
  })
})
