import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { SQLITE_RESOURCE_NAME, sqliteFile } from './sqlite-file'
import { SSH_PARAMS } from './ssh/params'

const opensFile = (scheme: string) =>
  getConnectionType(scheme) === ConnectionType.SQLite

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const path = opensFile(scheme) ? sqliteFile.path(connectionString) : null
  return {
    defaultResourceName: path ? SQLITE_RESOURCE_NAME : database || null,
    displayUrl: path
      ? path.slice(path.lastIndexOf('/') + 1)
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
  if (opensFile(readConnectionString(connectionString).scheme)) {
    return connectionString
  }
  const url = new SafeURL(connectionString)
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
