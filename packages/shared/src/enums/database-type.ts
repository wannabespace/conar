export enum DatabaseType {
  Postgres = 'postgres',
}

export const databaseLabels: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'PostgreSQL',
}
