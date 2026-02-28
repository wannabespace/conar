import type { SqlLanguage } from 'sql-formatter'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { format } from 'sql-formatter'

export function formatSql(
  sql: string,
  type: ConnectionType,
) {
  const langMap: Record<ConnectionType, SqlLanguage> = {
    [ConnectionType.Postgres]: 'postgresql',
    [ConnectionType.Supabase]: 'postgresql',
    [ConnectionType.MySQL]: 'mysql',
    [ConnectionType.MSSQL]: 'tsql',
    [ConnectionType.ClickHouse]: 'mysql',
  }

  try {
    return format(sql, {
      language: langMap[type],
      keywordCase: 'upper',
    })
  }
  catch {
    return sql
  }
}
