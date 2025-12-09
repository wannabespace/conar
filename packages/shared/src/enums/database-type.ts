export enum DatabaseType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

export const databaseLabels: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'PostgreSQL',
  [DatabaseType.MySQL]: 'MySQL',
  [DatabaseType.MSSQL]: 'Microsoft SQL Server (beta)',
  [DatabaseType.ClickHouse]: 'ClickHouse (beta)',
}
