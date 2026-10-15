import { describe, expect, it } from 'bun:test'

import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

const PSQL_PARTS = {
  database: 'app',
  engine: ConnectionType.Postgres,
  host: 'db.acme.io',
  port: '5433',
  user: 'me',
}

describe('guessConnection — CLI commands', () => {
  it.each([
    ['psql -h db.acme.io -p 5433 -U me -d app', PSQL_PARTS],
    [
      'psql --host=db.acme.io --port=5433 --username=me --dbname=app -c "select 1"',
      PSQL_PARTS,
    ],
    ['psql -h db.acme.io -p5433 -W app me', PSQL_PARTS],
    [
      'PGPASSWORD=pw psql \\\n  -h db.acme.io \\\n  -p 5433 -U me app',
      { ...PSQL_PARTS, password: 'pw' },
    ],
    [
      'PGPASSWORD=pw psql "postgres://me@db.acme.io:5433/app"',
      { ...PSQL_PARTS, password: 'pw' },
    ],
    [
      'docker exec -it pg psql "host=db.acme.io port=5433 user=me dbname=app"',
      PSQL_PARTS,
    ],
    [
      "mysql -h db.acme.io -P 3307 -u root -p'se cret' shop",
      {
        database: 'shop',
        engine: ConnectionType.MySQL,
        host: 'db.acme.io',
        password: 'se cret',
        port: '3307',
        user: 'root',
      },
    ],
    [
      'mariadb --host=db.acme.io --user=root --password -D shop',
      {
        database: 'shop',
        engine: ConnectionFlavor.MariaDB,
        host: 'db.acme.io',
        user: 'root',
      },
    ],
    [
      'PGPASSWORD=x mariadb -h h',
      { engine: ConnectionType.Postgres, host: 'h', password: 'x' },
    ],
    [
      'mysql -u root -p shop',
      { database: 'shop', engine: ConnectionType.MySQL, user: 'root' },
    ],
    [
      'sqlcmd -S tcp:mssql.acme.io,1433 -U sa -P pw -d master',
      {
        database: 'master',
        engine: ConnectionType.MSSQL,
        host: 'mssql.acme.io',
        password: 'pw',
        port: '1433',
        user: 'sa',
      },
    ],
    [
      'clickhouse-client --host ch.acme.io --port 9000 --user default --password pw --database logs',
      {
        database: 'logs',
        engine: ConnectionType.ClickHouse,
        host: 'ch.acme.io',
        password: 'pw',
        port: '8123',
        user: 'default',
      },
    ],
    [
      "clickhouse client --host abc.eu-west-1.aws.clickhouse.cloud --secure --password 'pw'",
      {
        engine: ConnectionType.ClickHouse,
        host: 'abc.eu-west-1.aws.clickhouse.cloud',
        password: 'pw',
        port: '8443',
      },
    ],
  ])('reads %s', (text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('cli')
    expect(guess?.parts).toStrictEqual(parts)
  })
})
