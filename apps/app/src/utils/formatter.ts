import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SqlLanguage } from 'sql-formatter'
import { format } from 'sql-formatter'

export function formatSql(sql: string, type: ConnectionType) {
  const langMap: Record<ConnectionType, SqlLanguage> = {
    [ConnectionType.Postgres]: 'postgresql',
    [ConnectionType.MySQL]: 'mysql',
    [ConnectionType.MSSQL]: 'tsql',
    [ConnectionType.ClickHouse]: 'mysql',
  }

  try {
    return format(sql, {
      language: langMap[type],
      keywordCase: 'upper',
    })
  } catch {
    return sql
  }
}
