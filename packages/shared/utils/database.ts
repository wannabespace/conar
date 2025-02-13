import { DatabaseType } from '../enums/database-type'

export const protocolMap: Record<DatabaseType, string> = {
  [DatabaseType.Postgres]: 'postgresql',
}

export function getProtocol(type: DatabaseType) {
  return protocolMap[type]
}
