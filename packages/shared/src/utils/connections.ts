import { DatabaseType } from '../enums/database-type'

export function parseConnectionString(connectionString: string) {
  const url = new URL(connectionString)

  return {
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    options: Object.fromEntries(url.searchParams.entries()),
  }
}

export const protocolMap: Record<DatabaseType, string[]> = {
  [DatabaseType.Postgres]: ['postgresql', 'postgres'],
}

export function getProtocols(type: DatabaseType) {
  return protocolMap[type]
}
