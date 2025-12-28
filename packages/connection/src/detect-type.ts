import { DatabaseType } from '@conar/shared/enums/database-type'

const protocolToType: Record<string, DatabaseType> = {
  'postgresql:': DatabaseType.Postgres,
  'postgres:': DatabaseType.Postgres,
  'mysql:': DatabaseType.MySQL,
  'sqlserver:': DatabaseType.MSSQL,
  'mssql:': DatabaseType.MSSQL,
  'https:': DatabaseType.ClickHouse,
  'http:': DatabaseType.ClickHouse,
}

export function detectTypeFromConnectionString(connectionString: string): DatabaseType | null {
  if (!connectionString.trim()) {
    return null
  }

  try {
    const normalizedString = connectionString.includes('://')
      ? connectionString
      : connectionString.replace(':', '://')

    const url = new URL(normalizedString)
    return protocolToType[url.protocol] ?? null
  }
  catch {
    return null
  }
}
