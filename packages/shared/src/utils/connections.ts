import { DatabaseType } from '../enums/database-type'

export const protocolMap: Record<DatabaseType, string[]> = {
  [DatabaseType.Postgres]: ['postgresql', 'postgres'],
  [DatabaseType.MySQL]: ['mysql'],
}

export function getProtocols(type: DatabaseType) {
  return protocolMap[type]
}
