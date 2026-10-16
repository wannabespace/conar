import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { objectEntries } from '@tamery/shared/utils'

import type { SqliteLocation } from './sqlite-location'
import { getSqliteLocation } from './sqlite-location'

/** Every libSQL server reads as Turso, so a host Turso adds later needs no entry here. */
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

export const getSqliteLocationOf = (provider: Provider | null) =>
  objectEntries(PROVIDER_OF_SQLITE_LOCATION).find(
    ([, located]) => located === provider
  )?.[0] ?? 'file'
