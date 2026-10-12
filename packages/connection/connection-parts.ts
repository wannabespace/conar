import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import type { SshTunnel } from './ssh/params'
import { deleteSshParams, setSshParams, sshTunnelOf } from './ssh/params'

export interface ConnectionParts {
  database: string
  host: string
  /** Driver options as a query string, without the leading `?` and without the `ssh_*` params. */
  options: string
  password: string
  port: string
  ssh: SshTunnel | null
  type: ConnectionType | null
  user: string
}

export const DEFAULT_PORTS: Record<ConnectionType, number> = {
  [ConnectionType.ClickHouse]: 8123,
  [ConnectionType.MSSQL]: 1433,
  [ConnectionType.MySQL]: 3306,
  [ConnectionType.Postgres]: 5432,
}

const CLICKHOUSE_HTTPS_PORTS = new Set(['443', '8443'])

const TYPE_OF_SCHEME: Record<string, ConnectionType> = {
  clickhouse: ConnectionType.ClickHouse,
  http: ConnectionType.ClickHouse,
  https: ConnectionType.ClickHouse,
  mariadb: ConnectionType.MySQL,
  mssql: ConnectionType.MSSQL,
  mysql: ConnectionType.MySQL,
  mysql2: ConnectionType.MySQL,
  pg: ConnectionType.Postgres,
  postgres: ConnectionType.Postgres,
  postgresql: ConnectionType.Postgres,
  sqlserver: ConnectionType.MSSQL,
}

/** Reads `postgresql+psycopg2` and `jdbc:mysql` as their engine's scheme too. */
export const typeOfScheme = (scheme: string): ConnectionType | null =>
  TYPE_OF_SCHEME[
    scheme
      .toLowerCase()
      .replace(/^jdbc:/u, '')
      .replace(/[+:].*$/u, '')
  ] ?? null

const schemeOf = (type: ConnectionType, port: string) => {
  if (type === ConnectionType.ClickHouse) {
    return CLICKHOUSE_HTTPS_PORTS.has(port) ? 'https' : 'http'
  }
  return type === ConnectionType.MSSQL ? 'sqlserver' : type
}

export const toConnectionString = (parts: ConnectionParts): string => {
  if (!parts.type || !parts.host) {
    return ''
  }

  const port = parts.port || String(DEFAULT_PORTS[parts.type])
  const url = new SafeURL(
    `${schemeOf(parts.type, port)}://${parts.host}:${port}/${parts.database}`
  )
  url.username = parts.user
  url.password = parts.password
  url.search = parts.options
  if (parts.ssh?.host) {
    setSshParams(url.searchParams, parts.ssh)
  }
  return url.toString()
}

export const toConnectionParts = (
  connectionString: string
): ConnectionParts => {
  const url = new SafeURL(connectionString)
  const ssh = sshTunnelOf(url.searchParams)
  deleteSshParams(url.searchParams)

  return {
    database: decodeURIComponent(url.pathname.slice(1)),
    host: url.hostname,
    options: url.searchParams.toString(),
    password: url.password,
    port: url.port,
    ssh,
    type: typeOfScheme(url.protocol.slice(0, -1)),
    user: url.username,
  }
}
