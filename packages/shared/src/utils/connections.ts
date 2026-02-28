import { ConnectionType } from '@conar/shared/enums/connection-type'

export function isPostgresLikeConnection(type: ConnectionType): boolean {
  return type === ConnectionType.Postgres || type === ConnectionType.Supabase
}

export function getPostgresQueryKey(type: ConnectionType): 'postgres' | 'supabase' {
  return type === ConnectionType.Supabase ? 'supabase' : 'postgres'
}

export const placeholderMap: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'postgresql://user:password@host:port/database?sslmode=require',
  [ConnectionType.Supabase]: 'postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres',
  [ConnectionType.MySQL]: 'mysql://user:password@host:port/database?options',
  [ConnectionType.MSSQL]: 'sqlserver://user:password@host:port/database?options',
  [ConnectionType.ClickHouse]: 'https://user:password@host:port',
}
