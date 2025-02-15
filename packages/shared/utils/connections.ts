import { ConnectionType } from '../enums/connection-type'

export interface Connection {
  protocol: string
  username: string
  password: string | null
  host: string
  port: number
  database: string
  options: string | null
}

export function parseConnectionString(connectionString: string) {
  const url = new URL(connectionString)

  const parsed: Connection = {
    protocol: url.protocol.slice(0, -1),
    username: url.username,
    password: url.password || null,
    host: url.hostname,
    port: Number.parseInt(url.port),
    database: url.pathname.slice(1),
    options: url.searchParams.toString() || null,
  }

  if (!parsed.protocol || !parsed.host || !parsed.port || !parsed.database) {
    throw new Error('Invalid connection string format')
  }

  return parsed
}

export const protocolMap: Record<ConnectionType, string[]> = {
  [ConnectionType.Postgres]: ['postgresql', 'postgres'],
}

export function getProtocols(type: ConnectionType) {
  return protocolMap[type]
}
