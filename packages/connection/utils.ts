import { SafeURL } from '@tamery/shared/safe-url'

import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { sqliteFile } from './sqlite-file'
import { SSH_PARAMS } from './ssh/params'

const SQLITE_SCHEME = 'sqlite'

/** The one database SQLite opens a file as. */
export const SQLITE_RESOURCE_NAME = 'main'

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const sqlite = scheme === SQLITE_SCHEME
  return {
    defaultResourceName: sqlite ? SQLITE_RESOURCE_NAME : database || null,
    displayUrl: sqlite
      ? sqliteFile.name(sqliteFile.path(connectionString))
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
  const url = new SafeURL(connectionString)
  if (url.protocol === `${SQLITE_SCHEME}:`) {
    return connectionString
  }
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
