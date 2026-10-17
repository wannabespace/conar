import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { getProviderOfScheme } from './provider'
import { connectionSecrets } from './secrets'
import { SSH_PARAMS } from './ssh/params'

export const SQLITE_RESOURCE_NAME = 'main'

const getSqliteDisplayName = ({
  database,
  host,
  scheme,
}: {
  database: string
  host: string
  scheme: string
}) => {
  if (!host) {
    return database.slice(database.lastIndexOf('/') + 1)
  }
  return getProviderOfScheme(scheme) === Provider.CloudflareD1 ? database : host
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const isSqlite = getConnectionType(scheme) === ConnectionType.SQLite
  return {
    defaultResourceName: isSqlite ? SQLITE_RESOURCE_NAME : database || null,
    displayUrl: isSqlite
      ? getSqliteDisplayName({ database, host, scheme })
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
