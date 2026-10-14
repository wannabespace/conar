import { ConnectionType } from '@tamery/shared/enums/connection-type'

import {
  CLICKHOUSE_HTTP_PORT_OF_NATIVE,
  CLICKHOUSE_HTTPS_PORT,
  DEFAULT_PORTS,
} from './connection-parts'

interface HostHint {
  directHostOf?: (host: string) => string
  ipv6Only?: RegExp
  label: string
  port?: string
  projectInUser?: RegExp
  suffixes: string[]
  /** The engine's default port is this provider's session pooler. */
  transactionPoolerPort?: string
  type?: ConnectionType
}

const SUPABASE_TRANSACTION_POOLER_PORT = '6543'

const HOST_HINTS: HostHint[] = [
  {
    ipv6Only: /^db\.[^.]+\.supabase\.co$/iu,
    label: 'Supabase',
    projectInUser: /\.pooler\.supabase\.com$/iu,
    suffixes: ['.supabase.co', '.supabase.com'],
    transactionPoolerPort: SUPABASE_TRANSACTION_POOLER_PORT,
    type: ConnectionType.Postgres,
  },
  {
    directHostOf: (host) => host.replace(/-pooler(?=\.)/iu, ''),
    label: 'Neon',
    suffixes: ['.neon.tech'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Render',
    suffixes: ['.render.com'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Azure Database for PostgreSQL',
    suffixes: ['.postgres.database.azure.com'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'CockroachDB Cloud',
    port: '26257',
    suffixes: ['.cockroachlabs.cloud'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Crunchy Bridge',
    suffixes: ['.db.postgresbridge.com'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Timescale',
    suffixes: ['.tsdb.cloud.timescale.com'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Prisma Postgres',
    suffixes: ['db.prisma.io'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Xata',
    suffixes: ['.sql.xata.sh'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Nile',
    suffixes: ['db.thenile.dev'],
    type: ConnectionType.Postgres,
  },
  {
    label: 'Fly.io',
    suffixes: ['.flympg.net'],
    type: ConnectionType.Postgres,
  },
  { label: 'Railway', suffixes: ['.railway.app', '.rlwy.net'] },
  { label: 'AWS RDS', suffixes: ['.rds.amazonaws.com'] },
  {
    label: 'Azure SQL',
    suffixes: ['.database.windows.net'],
    type: ConnectionType.MSSQL,
  },
  {
    label: 'PlanetScale',
    suffixes: ['.psdb.cloud', '.planetscale.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'Azure Database for MySQL',
    suffixes: ['.mysql.database.azure.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'SingleStore',
    suffixes: ['.svc.singlestore.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'MariaDB SkySQL',
    suffixes: ['.skysql.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'TiDB Cloud',
    suffixes: ['.tidbcloud.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'ClickHouse Cloud',
    port: CLICKHOUSE_HTTPS_PORT,
    suffixes: ['.clickhouse.cloud'],
    type: ConnectionType.ClickHouse,
  },
  {
    label: 'Altinity.Cloud',
    port: CLICKHOUSE_HTTPS_PORT,
    suffixes: ['.altinity.cloud'],
    type: ConnectionType.ClickHouse,
  },
  { label: 'Aiven', suffixes: ['.aivencloud.com'] },
  {
    label: 'DigitalOcean',
    port: '25060',
    suffixes: ['.db.ondigitalocean.com'],
  },
  { label: 'Alibaba Cloud RDS', suffixes: ['.rds.aliyuncs.com'] },
]

export const TYPE_OF_PORT: Record<string, ConnectionType> = {
  ...Object.fromEntries(
    [
      ...Object.keys(CLICKHOUSE_HTTP_PORT_OF_NATIVE),
      ...Object.values(CLICKHOUSE_HTTP_PORT_OF_NATIVE),
    ].map((port) => [port, ConnectionType.ClickHouse])
  ),
  ...Object.fromEntries(
    Object.values(ConnectionType).map((type) => [DEFAULT_PORTS[type], type])
  ),
  5433: ConnectionType.Postgres,
  [SUPABASE_TRANSACTION_POOLER_PORT]: ConnectionType.Postgres,
}

const LOCAL_HOSTS = new Set(['localhost', '::1', '[::1]'])
const LOOPBACK_IPV4 = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u
export const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u
const PRIVATE_IPV4 =
  /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/u
const PRIVATE_IPV6 = /^\[?f[cd][\da-f]{2}:/iu
const PRIVATE_NAME =
  /\.(?:internal|local|lan|svc|cluster\.local|corp|intranet|home\.arpa|ts\.net)$/iu

export const hostHintOf = (host: string): HostHint | undefined => {
  const lowerHost = host.toLowerCase()
  return HOST_HINTS.find((hint) =>
    hint.suffixes.some((suffix) => lowerHost.endsWith(suffix))
  )
}

export const isLocalHost = (host: string) =>
  LOCAL_HOSTS.has(host.toLowerCase()) || LOOPBACK_IPV4.test(host)

const isPrivateHost = (host: string) =>
  PRIVATE_IPV4.test(host) || PRIVATE_IPV6.test(host) || PRIVATE_NAME.test(host)

const isServiceName = (host: string) =>
  !host.includes('.') &&
  !isLocalHost(host) &&
  !IPV4.test(host) &&
  !host.includes(':')

export const isInternalHost = (host: string) =>
  isLocalHost(host) || isPrivateHost(host) || isServiceName(host)

export type HostKind = 'ipv6-only' | 'local' | 'private' | 'public' | 'service'

export const hostKindOf = (host: string): HostKind => {
  if (isLocalHost(host)) {
    return 'local'
  }
  if (isServiceName(host)) {
    return 'service'
  }
  if (isPrivateHost(host)) {
    return 'private'
  }
  return hostHintOf(host)?.ipv6Only?.test(host) ? 'ipv6-only' : 'public'
}
