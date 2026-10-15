import { describe, expect, it } from 'bun:test'

import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

describe('guessConnection — env files', () => {
  it.each([
    [
      'libpq variables',
      'export PGHOST=db.acme.io\nexport PGPORT=5432\nexport PGUSER=me\nexport PGPASSWORD="p w"\nexport PGDATABASE=app',
      {
        database: 'app',
        engine: ConnectionType.Postgres,
        host: 'db.acme.io',
        password: 'p w',
        port: '5432',
        user: 'me',
      },
    ],
    [
      'a Laravel .env, ignoring APP_URL',
      'APP_URL=http://localhost\nDB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=5432\nDB_DATABASE=laravel\nDB_USERNAME=root\nDB_PASSWORD=secret # local only',
      {
        database: 'laravel',
        engine: ConnectionType.Postgres,
        host: '127.0.0.1',
        password: 'secret',
        port: '5432',
        user: 'root',
      },
    ],
    [
      'a Laravel .env on MariaDB',
      'DB_CONNECTION=mariadb\nDB_HOST=127.0.0.1\nDB_DATABASE=laravel\nDB_USERNAME=root',
      {
        database: 'laravel',
        engine: ConnectionFlavor.MariaDB,
        host: '127.0.0.1',
        user: 'root',
      },
    ],
    [
      'a MariaDB container environment',
      'MARIADB_ROOT_PASSWORD=rootpw\nMARIADB_DATABASE=shop',
      {
        database: 'shop',
        engine: ConnectionFlavor.MariaDB,
        password: 'rootpw',
        user: 'root',
      },
    ],
    [
      'generic DB_* variables typed by DB_TYPE',
      'DB_TYPE=sqlsrv\nDB_HOST=mssql.local\nDB_NAME=app',
      { database: 'app', engine: ConnectionType.MSSQL, host: 'mssql.local' },
    ],
    [
      'a docker-compose environment list, root password implying root',
      'environment:\n  - MYSQL_ROOT_PASSWORD=rootpw\n  - MYSQL_ROOT_HOST=%\n  - MYSQL_DATABASE=shop',
      {
        database: 'shop',
        engine: ConnectionType.MySQL,
        password: 'rootpw',
        user: 'root',
      },
    ],
    [
      'a docker-compose environment map',
      'environment:\n  POSTGRES_USER: me\n  POSTGRES_PASSWORD: pw\n  POSTGRES_DB: app',
      {
        database: 'app',
        engine: ConnectionType.Postgres,
        password: 'pw',
        user: 'me',
      },
    ],
    [
      'ClickHouse variables',
      'CLICKHOUSE_HOST=ch.local\nCLICKHOUSE_USER=default\nCLICKHOUSE_PASSWORD=pw\nCLICKHOUSE_DB=logs',
      {
        database: 'logs',
        engine: ConnectionType.ClickHouse,
        host: 'ch.local',
        password: 'pw',
        user: 'default',
      },
    ],
    [
      'the SQL Server image password',
      'ACCEPT_EULA=Y\nMSSQL_SA_PASSWORD=Str0ng!',
      { engine: ConnectionType.MSSQL, password: 'Str0ng!', user: 'sa' },
    ],
    [
      'a Rails database.yml, skipping ERB',
      'development:\n  adapter: mysql2\n  host: localhost\n  username: rails\n  password: <%= ENV["DB_PASSWORD"] %>\n  database: app_dev\ntest:\n  database: app_test',
      {
        database: 'app_dev',
        engine: ConnectionType.MySQL,
        host: 'localhost',
        user: 'rails',
      },
    ],
  ])('reads %s', (_, text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('env')
    expect(guess?.parts).toStrictEqual(parts)
  })

  it('prefers a database URL over loose variables', () => {
    expect(
      guessConnection(
        'DB_HOST=ignored.local\nDATABASE_URL=postgres://me@db.acme.io/app'
      )
    ).toMatchObject({ format: 'url', parts: { host: 'db.acme.io' } })
  })

  it('ignores unrelated variables', () => {
    expect(guessConnection('HOST=0.0.0.0\nPORT=3000\nUSER=valerii')).toBeNull()
  })
})
