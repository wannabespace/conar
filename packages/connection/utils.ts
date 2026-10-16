import type { SqliteLocation } from '@tamery/shared/enums/connection-type'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { sqliteFile } from './sqlite-file'
import { getSqliteLocation, SQLITE_RESOURCE_NAME } from './sqlite-location'
import { SSH_PARAMS } from './ssh/params'

const isSqlite = (scheme: string) =>
  getConnectionType(scheme) === ConnectionType.SQLite

const SQLITE_DISPLAY_NAMES: Record<
  SqliteLocation,
  (
    connectionString: string,
    parts: { database: string; host: string }
  ) => string
> = {
  d1: (_, { database }) => database,
  file: (connectionString) => {
    const path = sqliteFile.path(connectionString)
    return path.slice(path.lastIndexOf('/') + 1)
  },
  libsql: (_, { host }) => host,
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const sqliteLocation = isSqlite(scheme) ? getSqliteLocation(host) : null
  return {
    defaultResourceName: sqliteLocation
      ? SQLITE_RESOURCE_NAME
      : database || null,
    displayUrl: sqliteLocation
      ? SQLITE_DISPLAY_NAMES[sqliteLocation](connectionString, {
          database,
          host,
        })
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
  if (isSqlite(readConnectionString(connectionString).scheme)) {
    return connectionString
  }
  const url = new SafeURL(connectionString)
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
