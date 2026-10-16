import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'

import type { SqliteLocation } from './sqlite-location'
import { getSqliteLocation } from './sqlite-location'

const PROVIDER_OF_SQLITE_LOCATION: Record<SqliteLocation, Provider | null> = {
  d1: Provider.CloudflareD1,
  file: null,
  libsql: Provider.Turso,
}

export const getProvider = ({
  host,
  type,
}: {
  host: string
  type: ConnectionType | null
}) =>
  type === ConnectionType.SQLite
    ? PROVIDER_OF_SQLITE_LOCATION[getSqliteLocation(host)]
    : null
