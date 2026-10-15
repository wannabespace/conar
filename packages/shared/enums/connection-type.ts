export enum ConnectionType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MariaDB = 'mariadb',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

/** Never build SQL from a `ConnectionType`: every query runs on the dialect it speaks through. */
export enum SqlDialect {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

const DIALECT_OF_TYPE: Record<ConnectionType, SqlDialect> = {
  [ConnectionType.ClickHouse]: SqlDialect.ClickHouse,
  [ConnectionType.MariaDB]: SqlDialect.MySQL,
  [ConnectionType.MSSQL]: SqlDialect.MSSQL,
  [ConnectionType.MySQL]: SqlDialect.MySQL,
  [ConnectionType.Postgres]: SqlDialect.Postgres,
}

export const dialectOf = (type: ConnectionType) => DIALECT_OF_TYPE[type]

export const connectionTypeLabels: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'ClickHouse',
  [ConnectionType.MariaDB]: 'MariaDB',
  [ConnectionType.MSSQL]: 'Microsoft SQL Server',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.Postgres]: 'PostgreSQL',
}
