import { DatabaseType } from '../enums/database-type'

export const placeholderMap: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'postgresql://user:password@host:port/database?options',
  [DatabaseType.MySQL]: 'mysql://user:password@host:port/database?options',
  [DatabaseType.ClickHouse]: 'https://user:password@host:port',
  [DatabaseType.SQLite]: 'file:/path/to/database.db',
}
