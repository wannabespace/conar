import { SqlDialect } from '@tamery/shared/enums/connection-type'
import type { SqlLanguage } from 'sql-formatter'
import { format } from 'sql-formatter'

export const formatSql = (sql: string, type: SqlDialect) => {
  const langMap: Record<SqlDialect, SqlLanguage> = {
    [SqlDialect.Postgres]: 'postgresql',
    [SqlDialect.MySQL]: 'mysql',
    [SqlDialect.MSSQL]: 'tsql',
    [SqlDialect.ClickHouse]: 'clickhouse',
  }

  try {
    return format(sql, {
      keywordCase: 'upper',
      language: langMap[type],
    })
  } catch {
    return sql
  }
}
