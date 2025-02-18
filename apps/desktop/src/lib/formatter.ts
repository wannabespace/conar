import type { SqlLanguage } from 'sql-formatter'
import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { format } from 'sql-formatter'

export function formatSql(
  query: string,
  type: ConnectionType,
) {
  const langMap: Record<ConnectionType, SqlLanguage> = {
    [ConnectionType.Postgres]: 'postgresql',
  }

  return format(query, {
    language: langMap[type],
    keywordCase: 'upper',
  })
}
