import { DatabaseType } from '../enums/database-type'

export const placeholderMap: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'postgresql://user:password@host:port/database?options',
  [DatabaseType.MySQL]: 'mysql://user:password@host:port/database?options',
  [DatabaseType.MSSQL]: 'sqlserver://user:password@host:port/database?options',
  [DatabaseType.ClickHouse]: 'https://user:password@host:port',
}
