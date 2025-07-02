import { parse as parsePg } from 'pg-connection-string'
import { DatabaseType } from '../enums/database-type'

export function parseConnectionString(type: DatabaseType, connectionString: string) {
  const map = {
    [DatabaseType.Postgres]: (str: string) => parsePg(str, {}),
  } satisfies Record<DatabaseType, (str: string) => unknown>

  return map[type](connectionString)
}

export const protocolMap: Record<DatabaseType, string[]> = {
  [DatabaseType.Postgres]: ['postgresql', 'postgres'],
}

export function getProtocols(type: DatabaseType) {
  return protocolMap[type]
}
