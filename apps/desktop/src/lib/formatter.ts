import type { SqlLanguage } from 'sql-formatter'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { format } from 'sql-formatter'

const langMap: Record<Exclude<ConnectionType, ConnectionType.Redis>, SqlLanguage> = {
  [ConnectionType.Postgres]: 'postgresql',
  [ConnectionType.MySQL]: 'mysql',
  [ConnectionType.MSSQL]: 'tsql',
  [ConnectionType.ClickHouse]: 'mysql',
}

export function formatSql(
  sql: string,
  type: ConnectionType,
) {
  if (type === ConnectionType.Redis) {
    return sql
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
