import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

const PSQL_PARTS = {
  database: 'app',
  host: 'db.acme.io',
  port: '5433',
  type: ConnectionType.Postgres,
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
        host: 'db.acme.io',
        password: 'se cret',
        port: '3307',
        type: ConnectionType.MySQL,
        user: 'root',
      },
    ],
    [
      'mariadb --host=db.acme.io --user=root --password -D shop',
      {
        database: 'shop',
        host: 'db.acme.io',
        type: ConnectionType.MariaDB,
        user: 'root',
      },
    ],
    [
      'PGPASSWORD=x mariadb -h h',
      { host: 'h', password: 'x', type: ConnectionType.Postgres },
    ],
    [
      'mysql -u root -p shop',
      { database: 'shop', type: ConnectionType.MySQL, user: 'root' },
    ],
    [
      'sqlcmd -S tcp:mssql.acme.io,1433 -U sa -P pw -d master',
      {
        database: 'master',
        host: 'mssql.acme.io',
        password: 'pw',
        port: '1433',
        type: ConnectionType.MSSQL,
        user: 'sa',
      },
    ],
    [
      'clickhouse-client --host ch.acme.io --port 9000 --user default --password pw --database logs',
      {
        database: 'logs',
        host: 'ch.acme.io',
        password: 'pw',
        port: '8123',
        type: ConnectionType.ClickHouse,
        user: 'default',
      },
    ],
    [
      "clickhouse client --host abc.eu-west-1.aws.clickhouse.cloud --secure --password 'pw'",
      {
        host: 'abc.eu-west-1.aws.clickhouse.cloud',
        password: 'pw',
        port: '8443',
        type: ConnectionType.ClickHouse,
      },
    ],
  ])('reads %s', (text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('cli')
    expect(guess?.parts).toStrictEqual(parts)
  })
})
