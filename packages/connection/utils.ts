import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { SQLITE_RESOURCE_NAME, sqliteFile } from './sqlite-file'
import { getSqliteLocation } from './sqlite-remote'
import { SSH_PARAMS } from './ssh/params'

/** Every SQLite location, a file or a remote one, holds the single database `main`. */
const isSqlite = (scheme: string) =>
  getConnectionType(scheme) === ConnectionType.SQLite

const getDisplayUrl = (connectionString: string) => {
  const { database, host, scheme } = readConnectionString(connectionString)
  if (!isSqlite(scheme)) {
    return new SafeURL(connectionString).host
  }
  const location = getSqliteLocation(host)
  if (location === 'd1') {
    return database
  }
  if (location === 'libsql') {
    return host
  }
  const path = sqliteFile.path(connectionString)
  return path.slice(path.lastIndexOf('/') + 1)
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  return {
    defaultResourceName: isSqlite(scheme)
      ? SQLITE_RESOURCE_NAME
      : database || null,
    displayUrl: getDisplayUrl(connectionString),
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
