import { ConnectionType } from './enums/connection-type'

export const CONNECTION_RESOURCE_ROOT_SYMBOL = Symbol(
  'CONNECTION_RESOURCE_ROOT'
)
export const CONNECTION_RESOURCE_ROOT_LABEL = 'root' as const
export const CONNECTION_TYPES_WITHOUT_SCHEMAS: ConnectionType[] = [
  ConnectionType.ClickHouse,
]
export const CONNECTION_TYPES_WITH_EXPLAIN: ConnectionType[] = [
  ConnectionType.Postgres,
  ConnectionType.MySQL,
]
export const CONNECTION_TYPES_WITH_TRIGGERS: ConnectionType[] = [
  ConnectionType.Postgres,
  ConnectionType.MySQL,
  ConnectionType.MSSQL,
]
export const CONNECTION_TYPES_WITH_FUNCTIONS: ConnectionType[] = [
  ConnectionType.Postgres,
  ConnectionType.MySQL,
  ConnectionType.MSSQL,
]
export const CONNECTION_TYPES_WITHOUT_COLUMNS_RENAME: ConnectionType[] = [
  ConnectionType.ClickHouse,
]
export const CONNECTION_TYPES_WITH_CASCADE_DROP: ConnectionType[] = [
  ConnectionType.Postgres,
]

export const PROXY_ERROR_MESSAGE =
  "We can't connect to the proxy, please check your connection and try again."

export const RECONNECT_ERROR_PATTERNS = [
  'econnreset',
  'etimedout',
  'epipe',
  'econnrefused',
  'enotfound',
  'connection lost',
  'socket hang up',
  'socketerror',
  'network',
  'application failed to respond',
  'failed to fetch',
  'connection terminated unexpectedly',
  'the database system is not yet accepting connections',
  'the database system is starting up',
]
