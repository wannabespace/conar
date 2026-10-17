import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { getConnectionType } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { getSqliteProvider } from './provider'
import { connectionSecrets } from './secrets'
import { SSH_PARAMS } from './ssh/params'

export const SQLITE_RESOURCE_NAME = 'main'

const SQLITE_DISPLAY_NAMES: Record<
  Provider | ConnectionType.SQLite,
  (parts: { database: string; host: string }) => string
> = {
  [ConnectionType.SQLite]: ({ database }) =>
    database.slice(database.lastIndexOf('/') + 1),
  [Provider.CloudflareD1]: ({ database }) => database,
  [Provider.Turso]: ({ host }) => host,
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, scheme, searchParams } =
    readConnectionString(connectionString)
  const sqliteEngine =
    getConnectionType(scheme) === ConnectionType.SQLite
      ? (getSqliteProvider(host) ?? ConnectionType.SQLite)
      : null
  return {
    defaultResourceName: sqliteEngine ? SQLITE_RESOURCE_NAME : database || null,
    displayUrl: sqliteEngine
      ? SQLITE_DISPLAY_NAMES[sqliteEngine]({ database, host })
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
