import type { Engine } from '@tamery/shared/enums/connection-type'
import {
  ConnectionFlavor,
  ConnectionType,
  engines,
} from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { readConnectionString } from './parse-connection-string'
import type { SshTunnel } from './ssh/params'
import { deleteSshParams, setSshParams, sshTunnelOf } from './ssh/params'

export interface ConnectionParts {
  database: string
  host: string
  /** ClickHouse's transport as the string named it (`https://` or `http://`); `null` infers it from the port. */
  https: boolean | null
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

export const HTTPS_PORT = '443'
export const CLICKHOUSE_HTTPS_PORT = '8443'

export const CLICKHOUSE_HTTP_PORT_OF_NATIVE: Record<string, string> = {
  9000: String(DEFAULT_PORTS[ConnectionType.ClickHouse]),
  9440: CLICKHOUSE_HTTPS_PORT,
}

const portOf = ({
  https,
  port,
  type,
}: Partial<Pick<ConnectionParts, 'https' | 'port' | 'type'>>) => {
  if (port) {
    return port
  }
  if (https && type === ConnectionType.ClickHouse) {
    return HTTPS_PORT
  }
  return type ? String(DEFAULT_PORTS[type]) : ''
}

const ENGINE_OF_NAME: Record<string, Engine> = {
  ch: ConnectionType.ClickHouse,
  clickhouse: ConnectionType.ClickHouse,
  cockroachdb: ConnectionType.Postgres,
  http: ConnectionType.ClickHouse,
  https: ConnectionType.ClickHouse,
  mariadb: ConnectionFlavor.MariaDB,
  'microsoft sql server': ConnectionType.MSSQL,
  mssql: ConnectionType.MSSQL,
  mysql: ConnectionType.MySQL,
  mysql2: ConnectionType.MySQL,
  pg: ConnectionType.Postgres,
  pgsql: ConnectionType.Postgres,
  postgres: ConnectionType.Postgres,
  postgresql: ConnectionType.Postgres,
  sqlserver: ConnectionType.MSSQL,
  sqlsrv: ConnectionType.MSSQL,
  tedious: ConnectionType.MSSQL,
  trilogy: ConnectionType.MySQL,
}

/** A URL scheme or a tool's driver name, never a whole URL; a `+driver` suffix (`postgresql+asyncpg`) is dropped. */
export const engineOf = (name: string): Engine | undefined =>
  ENGINE_OF_NAME[name.toLowerCase().replace(/\+.*$/u, '')]

const format = (
  parts: ConnectionParts,
  missingSecrets: readonly string[] = []
): string => {
  if (!parts.type || !parts.host) {
    return ''
  }

  const port = portOf(parts)
  let scheme: string =
    parts.type === ConnectionType.MSSQL ? 'sqlserver' : parts.type
  if (parts.type === ConnectionType.ClickHouse) {
    const https =
      parts.https ?? (port === HTTPS_PORT || port === CLICKHOUSE_HTTPS_PORT)
    scheme = https ? 'https' : 'http'
  }
  const host =
    parts.host.includes(':') && !parts.host.startsWith('[')
      ? `[${parts.host}]`
      : parts.host
  const url = new SafeURL(
    `${scheme}://${host}:${port}/${encodeURIComponent(parts.database)}`
  )
  url.username = encodeURIComponent(parts.user)
  url.password = encodeURIComponent(parts.password)
  url.search = parts.options
  if (parts.ssh?.host) {
    setSshParams(url.searchParams, parts.ssh, missingSecrets)
  }
  return url.toString()
}

const HTTPS_OF_SCHEME: Record<string, boolean> = { http: false, https: true }

const parse = (connectionString: string): ConnectionParts => {
  const { scheme, searchParams, ...parts } =
    readConnectionString(connectionString)
  const ssh = sshTunnelOf(searchParams)
  deleteSshParams(searchParams)
  const engine = engineOf(scheme)

  return {
    ...parts,
    https: HTTPS_OF_SCHEME[scheme] ?? null,
    options: searchParams.toString(),
    ssh,
    type: engine ? engines.type(engine) : null,
  }
}

export const connectionParts = { format, parse, port: portOf }
