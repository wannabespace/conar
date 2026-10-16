export enum ConnectionType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MariaDB = 'mariadb',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

/** Never build a query from a `ConnectionType`: every query runs on the dialect it speaks through. */
export enum Dialect {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

const DIALECT_OF_TYPE: Record<ConnectionType, Dialect> = {
  [ConnectionType.ClickHouse]: Dialect.ClickHouse,
  [ConnectionType.MariaDB]: Dialect.MySQL,
  [ConnectionType.MSSQL]: Dialect.MSSQL,
  [ConnectionType.MySQL]: Dialect.MySQL,
  [ConnectionType.Postgres]: Dialect.Postgres,
}

export const getDialect = (type: ConnectionType) => DIALECT_OF_TYPE[type]

export const connectionTypeLabels: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'ClickHouse',
  [ConnectionType.MariaDB]: 'MariaDB',
  [ConnectionType.MSSQL]: 'Microsoft SQL Server',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.Postgres]: 'PostgreSQL',
}
