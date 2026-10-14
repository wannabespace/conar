import { ConnectionType } from '@tamery/shared/enums/connection-type'
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

/** ClickHouse's native-protocol ports, which users often paste, mapped to the HTTP interface Tamery talks to. */
export const CLICKHOUSE_HTTP_PORT_OF_NATIVE: Record<string, string> = {
  9000: String(DEFAULT_PORTS[ConnectionType.ClickHouse]),
  9440: CLICKHOUSE_HTTPS_PORT,
}

/** The port the driver dials: an `https://` ClickHouse string without one means 443, not the engine default. */
export const portOf = ({
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

const HTTPS_OF_SCHEME: Record<string, boolean> = { http: false, https: true }

/** Reads `postgresql+psycopg2` and `jdbc:mysql` as their engine's scheme too. */
export const typeOfScheme = (scheme: string): ConnectionType | null =>
  TYPE_OF_SCHEME[
    scheme
      .toLowerCase()
      .replace(/^jdbc:/u, '')
      .replace(/[+:].*$/u, '')
  ] ?? null

/** Sets each option in `changes` over `options`, replacing the key in any case: a paste may say `TrustServerCertificate`, the drivers read lowercase. */
export const mergeOptions = (options: string, changes: string) => {
  const updates = new URLSearchParams(changes)
  const replaced = new Set(updates.keys().map((key) => key.toLowerCase()))
  const merged = new URLSearchParams(
    [...new URLSearchParams(options)].filter(
      ([key]) => !replaced.has(key.toLowerCase())
    )
  )
  for (const [key, value] of updates) {
    merged.append(key, value)
  }
  return merged.toString()
}

export const toConnectionString = (parts: ConnectionParts): string => {
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
    setSshParams(url.searchParams, parts.ssh)
  }
  return url.toString()
}

export const toConnectionParts = (
  connectionString: string
): ConnectionParts => {
  const { scheme, searchParams, ...parts } =
    readConnectionString(connectionString)
  const ssh = sshTunnelOf(searchParams)
  deleteSshParams(searchParams)

  return {
    ...parts,
    https: HTTPS_OF_SCHEME[scheme] ?? null,
    options: searchParams.toString(),
    ssh,
    type: typeOfScheme(scheme),
  }
}
