export enum ConnectionType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MariaDB = 'mariadb',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
  SQLite = 'sqlite',
}

/** Never build a query from a `ConnectionType`: every query runs on the dialect it speaks through. */
export enum Dialect {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
  SQLite = 'sqlite',
}

const DIALECT_OF_TYPE: Record<ConnectionType, Dialect> = {
  [ConnectionType.ClickHouse]: Dialect.ClickHouse,
  [ConnectionType.MariaDB]: Dialect.MySQL,
  [ConnectionType.MSSQL]: Dialect.MSSQL,
  [ConnectionType.MySQL]: Dialect.MySQL,
  [ConnectionType.Postgres]: Dialect.Postgres,
  [ConnectionType.SQLite]: Dialect.SQLite,
}

export const getDialect = (type: ConnectionType) => DIALECT_OF_TYPE[type]

export const connectionTypeLabels: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'ClickHouse',
  [ConnectionType.MariaDB]: 'MariaDB',
  [ConnectionType.MSSQL]: 'Microsoft SQL Server',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.Postgres]: 'PostgreSQL',
  [ConnectionType.SQLite]: 'SQLite',
}

/** Where a SQLite connection's database lives. Not a `ConnectionType`: all three speak the same SQLite. */
export type SqliteLocation = 'd1' | 'file' | 'libsql'

export const sqliteLocationLabels: Record<SqliteLocation, string> = {
  d1: 'Cloudflare D1',
  file: 'SQLite',
  libsql: 'Turso',
}

/** SQLite appears once per location, so a list of these is keyed by `label`, never by `type`. */
export const engines = Object.values(ConnectionType).flatMap((type) =>
  type === ConnectionType.SQLite
    ? (['file', 'libsql', 'd1'] as const).map((sqliteLocation) => ({
        label: sqliteLocationLabels[sqliteLocation],
        sqliteLocation,
        type,
      }))
    : [
        {
          label: connectionTypeLabels[type],
          sqliteLocation: 'file' as const,
          type,
        },
      ]
)
