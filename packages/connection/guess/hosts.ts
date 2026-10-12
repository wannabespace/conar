import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { DEFAULT_PORTS } from '../connection-parts'

interface HostHint {
  label: string
  port?: string
  suffixes: string[]
  type?: ConnectionType
}

const HOST_HINTS: HostHint[] = [
  {
    label: 'Supabase',
    suffixes: ['.supabase.co', '.supabase.com'],
    type: ConnectionType.Postgres,
  },
  { label: 'Neon', suffixes: ['.neon.tech'], type: ConnectionType.Postgres },
  {
    label: 'Render',
    suffixes: ['.render.com'],
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
    label: 'TiDB Cloud',
    suffixes: ['.tidbcloud.com'],
    type: ConnectionType.MySQL,
  },
  {
    label: 'ClickHouse Cloud',
    port: '8443',
    suffixes: ['.clickhouse.cloud'],
    type: ConnectionType.ClickHouse,
  },
  { label: 'Aiven', suffixes: ['.aivencloud.com'] },
]

export const TYPE_OF_PORT: Record<string, ConnectionType> = {
  ...Object.fromEntries(
    Object.values(ConnectionType).map((type) => [DEFAULT_PORTS[type], type])
  ),
  5433: ConnectionType.Postgres,
  6543: ConnectionType.Postgres,
  8443: ConnectionType.ClickHouse,
  9000: ConnectionType.ClickHouse,
  9440: ConnectionType.ClickHouse,
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const hostHintOf = (host: string): HostHint | undefined => {
  const lowerHost = host.toLowerCase()
  return HOST_HINTS.find((hint) =>
    hint.suffixes.some((suffix) => lowerHost.endsWith(suffix))
  )
}

export const isLocalHost = (host: string) => LOCAL_HOSTS.has(host.toLowerCase())
