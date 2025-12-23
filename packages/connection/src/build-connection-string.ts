import type { DatabaseType } from '@conar/shared/enums/database-type'

export interface ConnectionFields {
  host: string
  port?: number | string
  user?: string
  password?: string
  database?: string
  options?: string
}

const protocolMap: Record<DatabaseType, string> = {
  postgres: 'postgresql',
  mysql: 'mysql',
  mssql: 'sqlserver',
  clickhouse: 'https',
}

export function buildConnectionString(
  type: DatabaseType,
  fields: ConnectionFields,
): string {
  const protocol = protocolMap[type]
  const { host, port, user, password, database, options } = fields

  if (!host) {
    return ''
  }

  let connectionString = `${protocol}://`

  if (user) {
    connectionString += user
    if (password) {
      connectionString += `:${password}`
    }
    connectionString += '@'
  }

  connectionString += host
  if (port) {
    connectionString += `:${port}`
  }

  if (database && type !== 'clickhouse') {
    connectionString += `/${database}`
  }

  if (options) {
    const trimmed = options.trim()
    if (trimmed) {
      if (trimmed.startsWith('?'))
        connectionString += trimmed
      else
        connectionString += `?${trimmed}`
    }
  }

  return connectionString
}
