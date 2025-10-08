export enum DatabaseType {
  Postgres = 'postgres',
  // MySQL = 'mysql',
}

export const databaseLabels: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'PostgreSQL',
  // [DatabaseType.MySQL]: 'MySQL',
}
