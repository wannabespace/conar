import { DatabaseType } from '../enums/database-type'

export const protocolMap: Record<DatabaseType, string[]> = {
  [DatabaseType.Postgres]: ['postgresql', 'postgres'],
}

export function getProtocols(type: DatabaseType) {
  return protocolMap[type]
}
