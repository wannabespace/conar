import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import type { SqliteLocation } from './sqlite-location'
import { getSqliteLocation, SQLITE_RESOURCE_NAME } from './sqlite-location'
import { SSH_PARAMS } from './ssh/params'

const SQLITE_DISPLAY_NAMES: Record<
  SqliteLocation,
  (parts: { database: string; host: string }) => string
> = {
  d1: ({ database }) => database,
  file: ({ database }) => database.slice(database.lastIndexOf('/') + 1),
  libsql: ({ host }) => host,
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const sqliteLocation =
    getConnectionType(scheme) === ConnectionType.SQLite
      ? getSqliteLocation(host)
      : null
  return {
    defaultResourceName: sqliteLocation
      ? SQLITE_RESOURCE_NAME
      : database || null,
    displayUrl: sqliteLocation
      ? SQLITE_DISPLAY_NAMES[sqliteLocation]({ database, host })
      : new SafeURL(connectionString).host,
    isInternal: isInternalHost(host),
    isPasswordPopulated: !!password,
    missingSecrets: connectionSecrets.missing(searchParams),
    usesSsh: !!searchParams.get(SSH_PARAMS.host),
  }
}

export const resourceConnectionString = (
  connectionString: string,
  resourceName: string | null
) => {
  if (
    getConnectionType(readConnectionString(connectionString).scheme) ===
    ConnectionType.SQLite
  ) {
    return connectionString
  }
  const url = new SafeURL(connectionString)
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
