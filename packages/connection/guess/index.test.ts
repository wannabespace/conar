import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

describe('guessConnection — unrecognised input', () => {
  it.each([
    [''],
    ['   '],
    ['p'],
    ['postgres:'],
    ['postgres://'],
    ['hello world'],
    ['{ "a": 1 }'],
    ['{ "broken": '],
    ['postgres://me@db.acme.io:99999/app'],
  ])('returns null for %p', (text) => {
    expect(guessConnection(text)).toBeNull()
  })
})

describe('guessConnection — snippets from configs and tools', () => {
  it.each([
    [
      'spring.datasource.url=jdbc:postgresql://localhost:5432/app\nspring.datasource.username=me\nspring.datasource.password=pw',
      { database: 'app', host: 'localhost', password: 'pw', user: 'me' },
    ],
    [
      'DATABASE_URL=postgres://me@db.acme.io:5432/app\nDB_PASSWORD=pw',
      { host: 'db.acme.io', password: 'pw', user: 'me' },
    ],
    [
      "module.exports = { client: 'pg', connection: { host: process.env.DB_HOST || 'db.acme.io', user: 'me', password: process.env.DB_PASSWORD, database: 'app' } }",
      {
        database: 'app',
        host: 'db.acme.io',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'host = db.acme.io port = 5433 dbname = app user = me',
      { database: 'app', host: 'db.acme.io', port: '5433', user: 'me' },
    ],
    [
      "DATABASES = {\n  'default': {\n    'ENGINE': 'django.db.backends.postgresql',\n    'NAME': 'app',\n    'USER': 'me',\n    'PASSWORD': 'pw',\n    'HOST': 'db.acme.io',\n  }\n}",
      {
        database: 'app',
        host: 'db.acme.io',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'services:\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: pw\n    ports:\n      - "5433:5432"',
      {
        host: 'localhost',
        password: 'pw',
        port: '5433',
        type: ConnectionType.Postgres,
      },
    ],
    [
      'endpoint = "app.abc.us-east-1.rds.amazonaws.com:5432"\nusername = "me"\npassword = "pw"',
      { host: 'app.abc.us-east-1.rds.amazonaws.com', port: '5432', user: 'me' },
    ],
    [
      'DSN=me:pw@tcp(db.acme.io:3306)/app?parseTime=true',
      {
        database: 'app',
        host: 'db.acme.io',
        password: 'pw',
        type: ConnectionType.MySQL,
      },
    ],
    [
      'db.acme.io:5432:app:me:pw',
      {
        database: 'app',
        host: 'db.acme.io',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'Driver={ODBC Driver 18 for SQL Server};Server=tcp:db.acme.io,1433;Database=app;Uid=me;Pwd=pw;',
      {
        host: 'db.acme.io',
        port: '1433',
        type: ConnectionType.MSSQL,
        user: 'me',
      },
    ],
    [
      'Server=.;Database=app;User Id=sa;Password=pw;TrustServerCertificate=True',
      { host: 'localhost', type: ConnectionType.MSSQL },
    ],
    ['jdbc:ch://ch.acme.io:8123/default', { type: ConnectionType.ClickHouse }],
    [
      'cockroachdb://root@crdb.acme.io:26257/defaultdb',
      { type: ConnectionType.Postgres },
    ],
    [
      'pg_dump -h db.acme.io -U me -p 5433 app > dump.sql',
      { database: 'app', host: 'db.acme.io', port: '5433', user: 'me' },
    ],
  ])('reads %p', (text, parts) => {
    expect(guessConnection(text)?.parts).toMatchObject(parts)
  })

  it('reads Npgsql as no particular engine, not SQL Server', () => {
    expect(
      guessConnection(
        'Host=db.acme.io;Username=me;Trust Server Certificate=true'
      )?.parts.type
    ).toBeUndefined()
  })

  it('reads a version number as nothing, not a host', () => {
    expect(guessConnection('v1.2.3')).toBeNull()
  })
})
