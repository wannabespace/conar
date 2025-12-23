export enum DatabaseType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
  SQLite = 'sqlite',
}

export const databaseLabels: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'PostgreSQL',
  [DatabaseType.MySQL]: 'MySQL',
  [DatabaseType.MSSQL]: 'Microsoft SQL Server',
  [DatabaseType.ClickHouse]: 'ClickHouse (beta)',
  [DatabaseType.SQLite]: 'SQLite',
}
