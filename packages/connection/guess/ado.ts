import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { DatabaseGuess } from './types'

const PAIR =
  /\s*(?<key>[^=;]+?)\s*=\s*(?<value>"(?:[^"]|"")*"|'(?:[^']|'')*'|\{(?:[^}]|\}\})*\}|[^;]*)\s*(?:;|$)/gu
const QUOTE_CLOSERS: Record<string, string> = { '"': '"', "'": "'", '{': '}' }
const SERVER = /^(?:\w+:)?(?<host>[^,\\]*)(?:\\[^,]*)?(?:,(?<port>\d+))?/u

/** MySqlConnector's own keys; `SSL Mode` is Npgsql's too. */
const MYSQL_KEYS = ['allowpublickeyretrieval', 'allowuservariables']
const MSSQL_KEYS = [
  'datasource',
  'encrypt',
  'initialcatalog',
  'integratedsecurity',
  'trustservercertificate',
]
const TYPE_OF_ODBC_DRIVER: [RegExp, ConnectionType][] = [
  [/sql server/iu, ConnectionType.MSSQL],
  [/postgres/iu, ConnectionType.Postgres],
  [/mysql|mariadb/iu, ConnectionType.MySQL],
]
const ENCRYPT_OFF = new Set(['false', 'no', 'optional'])
const TRUST_ON = new Set(['true', 'yes'])

/** Keys come back lowercased, without spaces or underscores. */
export const adoPairs = (text: string): Map<string, string> =>
  new Map(
    Array.from(
      text.matchAll(PAIR),
      ({ groups: { key = '', value = '' } = {} }): [string, string] => {
        const closer = QUOTE_CLOSERS[value.charAt(0)]
        return [
          key.toLowerCase().replaceAll(/[\s_]/gu, ''),
          closer && value.length > 1 && value.endsWith(closer)
            ? value.slice(1, -1).replaceAll(closer + closer, closer)
            : value,
        ]
      }
    )
  )

const LOCAL_SERVERS = new Set(['.', '(local)'])

export const mssqlAddress = (server: string) => {
  const { host = '', port = '' } = SERVER.exec(server)?.groups ?? {}
  return {
    host: LOCAL_SERVERS.has(host.toLowerCase()) ? 'localhost' : host,
    port,
  }
}

export const adoParts = (pairs: Map<string, string>) => {
  const valueOf = (keys: string[]) =>
    keys.map((key) => pairs.get(key)).find(Boolean) ?? ''
  const address = mssqlAddress(
    valueOf([
      'server',
      'datasource',
      'address',
      'addr',
      'networkaddress',
      'host',
      'servername',
    ])
  )
  const encrypt = pairs.get('encrypt')?.toLowerCase()
  const trust = pairs.get('trustservercertificate')?.toLowerCase()
  const options = new URLSearchParams()
  if (encrypt) {
    options.set('encrypt', String(!ENCRYPT_OFF.has(encrypt)))
  }
  if (trust) {
    options.set('trustservercertificate', String(TRUST_ON.has(trust)))
  }
  return {
    database: valueOf(['initialcatalog', 'database', 'databasename']),
    host: address.host,
    options: options.toString(),
    password: valueOf(['password', 'pwd']),
    port: address.port || valueOf(['port', 'portnumber']),
    user: valueOf(['userid', 'uid', 'user', 'username']),
  }
}

export const guessAdo = (text: string): DatabaseGuess | null => {
  if (!text.includes(';')) {
    return null
  }
  const pairs = adoPairs(text)
  const parts = adoParts(pairs)
  if (!parts.host) {
    return null
  }
  const driverType = TYPE_OF_ODBC_DRIVER.find(([driver]) =>
    driver.test(pairs.get('driver') ?? '')
  )?.[1]
  if (driverType) {
    return { format: 'ado', parts: { ...parts, type: driverType } }
  }
  const has = (keys: string[]) => keys.some((key) => pairs.has(key))
  if (has(MYSQL_KEYS)) {
    return { format: 'ado', parts: { ...parts, type: ConnectionType.MySQL } }
  }
  // SQL Server has no `Host` key, and Npgsql shares `Trust Server Certificate`.
  if (has(MSSQL_KEYS) && !pairs.has('host')) {
    return { format: 'ado', parts: { ...parts, type: ConnectionType.MSSQL } }
  }
  return { format: 'ado', parts }
}
