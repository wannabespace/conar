import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SafeURL } from './safe-url'

export const placeholderMap: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'postgresql://user:password@host:port/database?options',
  [ConnectionType.MySQL]: 'mysql://user:password@host:port/database?options',
  [ConnectionType.MSSQL]: 'sqlserver://user:password@host:port/database?options',
  [ConnectionType.ClickHouse]: 'https://user:password@host:port',
}

export const DATABASE_CONNECTION_CONFIG = {
  [ConnectionType.Postgres]: { protocol: 'postgresql', defaultPort: '5432' },
  [ConnectionType.MySQL]: { protocol: 'mysql', defaultPort: '3306' },
  [ConnectionType.MSSQL]: { protocol: 'sqlserver', defaultPort: '1433' },
  [ConnectionType.ClickHouse]: { protocol: 'https', defaultPort: '8123' },
} as const satisfies Record<ConnectionType, { protocol: string, defaultPort: string }>

export interface ConnectionFields {
  host: string
  port: string
  user: string
  password: string
  database: string
}

export function parseConnectionStringToFields(
  connectionString: string,
  type: ConnectionType,
): ConnectionFields {
  const { defaultPort } = DATABASE_CONNECTION_CONFIG[type]

  const defaults: ConnectionFields = {
    host: '',
    port: defaultPort,
    user: '',
    password: '',
    database: '',
  }

  const input = connectionString.trim()
  if (!input)
    return defaults

  try {
    const url = new SafeURL(input)

    return {
      host: url.hostname || '',
      port: url.port || defaultPort,
      user: url.username || '',
      password: url.password || '',
      database:
        url.pathname && url.pathname !== '/'
          ? url.pathname.slice(1)
          : '',
    }
  }
  catch {
    return defaults
  }
}

export function buildConnectionStringFromFields(
  fields: ConnectionFields,
  type: ConnectionType,
): string {
  const { protocol, defaultPort } = DATABASE_CONNECTION_CONFIG[type]
  if (!fields.host)
    return ''

  const url = new SafeURL(`${protocol}://${fields.host}`)

  if (fields.user)
    url.username = fields.user
  if (fields.password)
    url.password = fields.password

  const port = fields.port || defaultPort
  if (port && port !== defaultPort) {
    url.port = port
  }

  if (fields.database) {
    url.pathname = `/${fields.database}`
  }

  return url.toString()
}
