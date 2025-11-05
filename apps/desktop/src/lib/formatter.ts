import type { SqlLanguage } from 'sql-formatter'
import { DatabaseType } from '@conar/shared/enums/database-type'
import posthog from 'posthog-js'
import { format } from 'sql-formatter'

export function formatSql(
  sql: string,
  type: DatabaseType,
) {
  const langMap: Record<DatabaseType, SqlLanguage> = {
    [DatabaseType.Postgres]: 'postgresql',
  }

  try {
    return format(sql, {
      language: langMap[type],
      keywordCase: 'upper',
    })
  }
  catch (error) {
    posthog.captureException(error, {
      sql,
      type,
    })
    console.error('sql formatter error', error)
    return sql
  }
}
