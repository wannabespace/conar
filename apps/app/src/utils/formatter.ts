import { Dialect } from '@tamery/shared/enums/connection-type'
import type { SqlLanguage } from 'sql-formatter'
import { format } from 'sql-formatter'

export const formatSql = (sql: string, type: Dialect) => {
  const langMap: Record<Dialect, SqlLanguage> = {
    [Dialect.Postgres]: 'postgresql',
    [Dialect.MySQL]: 'mysql',
    [Dialect.MSSQL]: 'tsql',
    [Dialect.ClickHouse]: 'clickhouse',
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
