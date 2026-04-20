import { ConnectionType } from '@conar/shared/enums/connection-type'

import { RECONNECT_ERROR_PATTERNS } from '../constants'

export const placeholderMap: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'postgresql://user:password@host:port/database?options',
  [ConnectionType.MySQL]: 'mysql://user:password@host:port/database?options',
  [ConnectionType.MSSQL]: 'sqlserver://user:password@host:port/database?options',
  [ConnectionType.ClickHouse]: 'https://user:password@host:port',
}

export function isReconnectError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return RECONNECT_ERROR_PATTERNS.some(pattern => msg.includes(pattern.toLowerCase()))
  }
  return false
}
