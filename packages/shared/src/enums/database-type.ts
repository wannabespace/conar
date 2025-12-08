export enum DatabaseType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  ClickHouse = 'clickhouse',
  SQLite = 'sqlite',
}

export const databaseLabels: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'PostgreSQL',
  [DatabaseType.MySQL]: 'MySQL',
  [DatabaseType.ClickHouse]: 'ClickHouse (beta)',
  [DatabaseType.SQLite]: 'SQLite',
}
