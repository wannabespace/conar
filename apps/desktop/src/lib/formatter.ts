import type { SqlLanguage } from 'sql-formatter'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { format } from 'sql-formatter'

export function formatSql(
  query: string,
  type: DatabaseType,
) {
  const langMap: Record<DatabaseType, SqlLanguage> = {
    [DatabaseType.Postgres]: 'postgresql',
  }

  return format(query, {
    language: langMap[type],
    keywordCase: 'upper',
  })
}
