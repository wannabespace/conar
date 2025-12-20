import type { SqlLanguage } from 'sql-formatter'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { format } from 'sql-formatter'

export function formatSql(sql: string, type: DatabaseType) {
  const langMap: Record<DatabaseType, SqlLanguage> = {
    [DatabaseType.Postgres]: 'postgresql',
    [DatabaseType.MySQL]: 'mysql',
    [DatabaseType.MSSQL]: 'tsql',
    [DatabaseType.ClickHouse]: 'mysql',
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
