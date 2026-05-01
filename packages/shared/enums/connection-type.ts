export enum ConnectionType {
  Postgres = 'postgres',
  MySQL = 'mysql',
  MSSQL = 'mssql',
  ClickHouse = 'clickhouse',
}

export const connectionLabels: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'PostgreSQL',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.MSSQL]: 'Microsoft SQL Server',
  [ConnectionType.ClickHouse]: 'ClickHouse (beta)',
}
