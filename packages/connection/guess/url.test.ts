import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

describe('guessConnection — URLs', () => {
  it.each([
    [
      'postgresql+asyncpg://me:p%40ss@db.acme.io:5432/app',
      {
        database: 'app',
        host: 'db.acme.io',
        password: 'p@ss',
        port: '5432',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'mysql2://root:secret@localhost:3306/shop',
      {
        database: 'shop',
        host: 'localhost',
        password: 'secret',
        port: '3306',
        type: ConnectionType.MySQL,
        user: 'root',
      },
    ],
    [
      'mariadb://root@maria.local/shop',
      {
        database: 'shop',
        host: 'maria.local',
        type: ConnectionType.MySQL,
        user: 'root',
      },
    ],
    [
      'sqlserver://sa:pass@mssql.local:1433/master',
      {
        database: 'master',
        host: 'mssql.local',
        password: 'pass',
        port: '1433',
        type: ConnectionType.MSSQL,
        user: 'sa',
      },
    ],
    [
      'https://default:pw@ch.acme.io:8443/logs',
      {
        database: 'logs',
        host: 'ch.acme.io',
        https: true,
        password: 'pw',
        port: '8443',
        type: ConnectionType.ClickHouse,
        user: 'default',
      },
    ],
    [
      'postgres://me:100%@db.acme.io/my%3Fdb',
      {
        database: 'my?db',
        host: 'db.acme.io',
        password: '100%',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'postgres://me@db.acme.io/app?schema=public&sslmode=require',
      {
        database: 'app',
        host: 'db.acme.io',
        options: 'schema=public&sslmode=require',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
  ])('reads %s', (text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('url')
    expect(guess?.parts).toStrictEqual(parts)
  })

  it('maps ClickHouse native ports to their HTTP twins', () => {
    expect(
      guessConnection('clickhouse://default@ch.acme.io:9440/logs')?.parts.port
    ).toBe('8443')
  })

  it.each([
    ['a page link', 'https://keyboard-support.app.local.tamery.app/settings'],
    ['a docs link', 'https://github.com/acme/app#readme'],
    [
      'a homepage in a config',
      '{ "name": "app", "homepage": "https://acme.io" }',
    ],
  ])('ignores %s', (_, text) => {
    expect(guessConnection(text)).toBeNull()
  })

  it.each([
    ['its HTTP port', 'http://localhost:8123'],
    ['a ClickHouse Cloud host', 'https://abc.eu-west-1.aws.clickhouse.cloud'],
    ['a ClickHouse variable', 'CLICKHOUSE_URL=https://ch.acme.io'],
  ])('reads a web URL as ClickHouse by %s', (_, text) => {
    expect(guessConnection(text)?.parts.type).toBe(ConnectionType.ClickHouse)
  })

  it('keeps https on ClickHouse when the URL names no port', () => {
    expect(
      guessConnection('CLICKHOUSE_URL=https://ch.acme.io')?.parts
    ).toStrictEqual({
      host: 'ch.acme.io',
      https: true,
      port: '443',
      type: ConnectionType.ClickHouse,
    })
  })

  it('keeps https on ClickHouse on a custom port', () => {
    expect(
      guessConnection('CLICKHOUSE_URL=https://ch.acme.io:9443/logs')?.parts
    ).toStrictEqual({
      database: 'logs',
      host: 'ch.acme.io',
      https: true,
      port: '9443',
      type: ConnectionType.ClickHouse,
    })
  })

  it.each([
    ['DATABASE_URL="postgres://me:pw@db.acme.io/app"'],
    ["psql 'postgres://me:pw@db.acme.io/app'"],
    ['Use postgres://me:pw@db.acme.io/app.'],
    ['{ "url": "postgres://me:pw@db.acme.io/app", "logging": true }'],
  ])('extracts the URL from %s', (text) => {
    expect(guessConnection(text)?.parts).toStrictEqual({
      database: 'app',
      host: 'db.acme.io',
      password: 'pw',
      type: ConnectionType.Postgres,
      user: 'me',
    })
  })

  it.each([['postgres://[::1]'], ['(postgres://[::1])']])(
    'keeps the bracket closing an IPv6 host in %s',
    (text) => {
      expect(guessConnection(text)?.parts.host).toBe('::1')
    }
  )

  it('keeps a query password out of the options when the URL has one too', () => {
    expect(
      guessConnection(
        'postgres://me:pw@db.acme.io/app?password=pw&sslmode=require'
      )?.parts.options
    ).toBe('sslmode=require')
  })

  it('keeps the ssh tunnel stored in a Tamery connection string', () => {
    expect(
      guessConnection(
        'postgres://me@db.internal/app?ssh_host=bastion.acme.io&ssh_user=ubuntu'
      )?.parts.ssh
    ).toMatchObject({ auth: 'agent', host: 'bastion.acme.io', user: 'ubuntu' })
  })
})

describe('guessConnection — JDBC', () => {
  it.each([
    [
      'jdbc:postgresql://db.acme.io:5432/app?user=me&password=pw&ssl=true',
      {
        database: 'app',
        host: 'db.acme.io',
        options: 'ssl=true',
        password: 'pw',
        port: '5432',
        type: ConnectionType.Postgres,
        user: 'me',
      },
    ],
    [
      'jdbc:mysql://db.acme.io:3306/shop?user=root&password=pw',
      {
        database: 'shop',
        host: 'db.acme.io',
        password: 'pw',
        port: '3306',
        type: ConnectionType.MySQL,
        user: 'root',
      },
    ],
    [
      'jdbc:postgresql://srv.postgres.database.azure.com:5432/db?user=admin@srv&password=pw&sslmode=require',
      {
        database: 'db',
        host: 'srv.postgres.database.azure.com',
        options: 'sslmode=require',
        password: 'pw',
        port: '5432',
        type: ConnectionType.Postgres,
        user: 'admin@srv',
      },
    ],
    [
      'jdbc:mysql://srv.mysql.database.azure.com:3306/db?user=admin@srv&password=pw&useSSL=true',
      {
        database: 'db',
        host: 'srv.mysql.database.azure.com',
        options: 'usessl=true',
        password: 'pw',
        port: '3306',
        type: ConnectionType.MySQL,
        user: 'admin@srv',
      },
    ],
    [
      'jdbc:clickhouse://ch.acme.io:8123/logs',
      {
        database: 'logs',
        host: 'ch.acme.io',
        port: '8123',
        type: ConnectionType.ClickHouse,
      },
    ],
    [
      'jdbc:sqlserver://mssql.acme.io:1433;databaseName=db;user=sa;password={p;w};encrypt=true;trustServerCertificate=false;loginTimeout=30',
      {
        database: 'db',
        host: 'mssql.acme.io',
        options: 'encrypt=true&trustservercertificate=false',
        password: 'p;w',
        port: '1433',
        type: ConnectionType.MSSQL,
        user: 'sa',
      },
    ],
  ])('reads %s', (text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('jdbc')
    expect(guess?.parts).toStrictEqual(parts)
  })
})
