import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { firstValueOf } from './parts'
import type { DatabaseGuess } from './types'

const PAIR =
  /\s*(?<key>[^=;]+?)\s*=\s*(?<value>"(?:[^"]|"")*"|'(?:[^']|'')*'|\{(?:[^}]|\}\})*\}|[^;]*)\s*(?:;|$)/gu
const QUOTE_CLOSERS: Record<string, string> = { '"': '"', "'": "'", '{': '}' }
const SERVER = /^(?:\w+:)?(?<host>[^,\\]*)(?:\\[^,]*)?(?:,(?<port>\d+))?/u

const DATABASE_KEYS = ['initialcatalog', 'database', 'databasename']
const SERVER_KEYS = [
  'server',
  'datasource',
  'address',
  'addr',
  'networkaddress',
  'host',
  'servername',
]
/** MySqlConnector's own keys; `SSL Mode` is Npgsql's too. */
const MYSQL_KEYS = ['allowpublickeyretrieval', 'allowuservariables']
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

export const mssqlAddress = (server: string) => {
  const { host = '', port = '' } = SERVER.exec(server)?.groups ?? {}
  return { host, port }
}

export const adoParts = (pairs: Map<string, string>) => {
  const valueOf = (keys: string[]) =>
    firstValueOf(keys, (key) => pairs.get(key))
  const address = mssqlAddress(valueOf(SERVER_KEYS))
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
    database: valueOf(DATABASE_KEYS),
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
  const isMySql = MYSQL_KEYS.some((key) => pairs.has(key))
  return {
    format: 'ado',
    parts: isMySql ? { ...parts, type: ConnectionType.MySQL } : parts,
  }
}
