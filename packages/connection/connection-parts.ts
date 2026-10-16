import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'
import { objectEntries } from '@tamery/shared/utils'

import { readConnectionString } from './parse-connection-string'
import { sqliteFile } from './sqlite-file'
import type { SqliteLocation } from './sqlite-location'
import { D1_HOST, getSqliteLocation } from './sqlite-location'
import type { SshTunnel } from './ssh/params'
import { deleteSshParams, setSshParams, getSshTunnel } from './ssh/params'

export interface ConnectionParts {
  /** A SQLite file's path, D1's database ID. */
  database: string
  host: string
  /** ClickHouse's transport as the string named it (`https://` or `http://`); `null` infers it from the port. */
  https: boolean | null
  /** Driver options as a query string, without the leading `?` and without the `ssh_*` params. */
  options: string
  /** Also a libSQL or D1 token, so every secret path treats it as the password. */
  password: string
  port: string
  ssh: SshTunnel | null
  type: ConnectionType | null
  user: string
}

export const DEFAULT_PORTS: Record<ConnectionType, number | null> = {
  [ConnectionType.ClickHouse]: 8123,
  [ConnectionType.MariaDB]: 3306,
  [ConnectionType.MSSQL]: 1433,
  [ConnectionType.MySQL]: 3306,
  [ConnectionType.Postgres]: 5432,
  [ConnectionType.SQLite]: null,
}

/** MariaDB shares MySQL's port, so a bare port names MySQL. */
export const TYPE_OF_DEFAULT_PORT: Record<string, ConnectionType> =
  Object.fromEntries(
    objectEntries(DEFAULT_PORTS)
      .filter(([type, port]) => type !== ConnectionType.MariaDB && port)
      .map(([type, port]) => [port, type])
  )

export const HTTPS_PORT = '443'
export const CLICKHOUSE_HTTPS_PORT = '8443'

export const CLICKHOUSE_HTTP_PORT_OF_NATIVE: Record<string, string> = {
  9000: String(DEFAULT_PORTS[ConnectionType.ClickHouse]),
  9440: CLICKHOUSE_HTTPS_PORT,
}

const getPort = ({
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
  return String((type && DEFAULT_PORTS[type]) ?? '')
}

const TYPE_OF_NAME: Record<string, ConnectionType> = {
  ch: ConnectionType.ClickHouse,
  clickhouse: ConnectionType.ClickHouse,
  cockroachdb: ConnectionType.Postgres,
  d1: ConnectionType.SQLite,
  http: ConnectionType.ClickHouse,
  https: ConnectionType.ClickHouse,
  libsql: ConnectionType.SQLite,
  mariadb: ConnectionType.MariaDB,
  'microsoft sql server': ConnectionType.MSSQL,
  mssql: ConnectionType.MSSQL,
  mysql: ConnectionType.MySQL,
  mysql2: ConnectionType.MySQL,
  pg: ConnectionType.Postgres,
  pgsql: ConnectionType.Postgres,
  postgres: ConnectionType.Postgres,
  postgresql: ConnectionType.Postgres,
  sqlite: ConnectionType.SQLite,
  sqlite3: ConnectionType.SQLite,
  sqlserver: ConnectionType.MSSQL,
  sqlsrv: ConnectionType.MSSQL,
  tedious: ConnectionType.MSSQL,
  trilogy: ConnectionType.MySQL,
}

/** A URL scheme or a tool's driver name, never a whole URL; a `+driver` suffix (`postgresql+asyncpg`) is dropped. */
export const getConnectionType = (name: string): ConnectionType | null =>
  TYPE_OF_NAME[name.toLowerCase().replace(/\+.*$/u, '')] ?? null

const withCredentials = (
  base: string,
  { options, password, user }: ConnectionParts
) => {
  const url = new SafeURL(base)
  url.username = encodeURIComponent(user)
  url.password = encodeURIComponent(password)
  url.search = options
  return url
}

const SQLITE_FORMATS: Record<
  SqliteLocation,
  (parts: ConnectionParts) => string
> = {
  d1: (parts) =>
    withCredentials(
      `d1://${D1_HOST}/${encodeURIComponent(parts.database)}`,
      parts
    ).toString(),
  file: ({ database }) => database && sqliteFile.connectionString(database),
  libsql: (parts) =>
    withCredentials(
      `libsql://${parts.host}${parts.port ? `:${parts.port}` : ''}`,
      parts
    ).toString(),
}

const format = (
  parts: ConnectionParts,
  missingSecrets: readonly string[] = []
): string => {
  if (parts.type === ConnectionType.SQLite) {
    return SQLITE_FORMATS[getSqliteLocation(parts.host)](parts)
  }
  if (!parts.type || !parts.host) {
    return ''
  }

  const port = getPort(parts)
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
  const url = withCredentials(
    `${scheme}://${host}:${port}/${encodeURIComponent(parts.database)}`,
    parts
  )
  if (parts.ssh?.host) {
    setSshParams(url.searchParams, parts.ssh, missingSecrets)
  }
  return url.toString()
}

const HTTPS_OF_SCHEME: Record<string, boolean> = { http: false, https: true }

const AUTH_TOKEN_PARAM = 'authtoken'

/** A SQLite file's path is the whole string, not its URL path; libSQL may carry its token as a param. */
const sqliteParts = (
  connectionString: string,
  parts: Pick<ConnectionParts, 'database' | 'host' | 'password'>,
  searchParams: URLSearchParams
) => {
  if (!parts.host) {
    return { database: sqliteFile.path(connectionString) }
  }
  const authToken = searchParams.get(AUTH_TOKEN_PARAM)
  searchParams.delete(AUTH_TOKEN_PARAM)
  return { password: authToken ?? parts.password }
}

const parse = (connectionString: string): ConnectionParts => {
  const { scheme, searchParams, ...parts } =
    readConnectionString(connectionString)
  const ssh = getSshTunnel(searchParams)
  deleteSshParams(searchParams)
  const type = getConnectionType(scheme)
  // Before `options` is read: it takes libSQL's token out of the params.
  const sqlite =
    type === ConnectionType.SQLite
      ? sqliteParts(connectionString, parts, searchParams)
      : null

  return {
    ...parts,
    ...sqlite,
    https: HTTPS_OF_SCHEME[scheme] ?? null,
    options: searchParams.toString(),
    ssh,
    type,
  }
}

export const connectionParts = { format, parse, port: getPort }
