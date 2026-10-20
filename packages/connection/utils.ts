import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { SafeURL } from '@tamery/shared/safe-url'

import { connectionParts } from './connection-parts'
import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { SSH_PARAMS } from './ssh/params'

export const SQLITE_RESOURCE_NAME = 'main'

interface EngineString {
  /** The database the server opens when the string names none; absent when only the server knows (a login's default). */
  defaultDatabase?: (user: string) => string
  label: (parts: { address: string; database: string; host: string }) => string
  /** The one resource the engine opens, kept out of the string's path; `null` when the path names it. */
  resource: string | null
}

const SERVER_STRING: EngineString = {
  label: ({ address }) => address,
  resource: null,
}

const POSTGRES_STRING: EngineString = {
  ...SERVER_STRING,
  defaultDatabase: (user) => user,
}

const ENGINE_STRINGS: Record<ConnectionType | Provider, EngineString> = {
  [ConnectionType.ClickHouse]: {
    ...SERVER_STRING,
    defaultDatabase: () => 'default',
  },
  [ConnectionType.MariaDB]: SERVER_STRING,
  [ConnectionType.MSSQL]: SERVER_STRING,
  [ConnectionType.MySQL]: SERVER_STRING,
  [ConnectionType.Postgres]: POSTGRES_STRING,
  [ConnectionType.SQLite]: {
    label: ({ database }) => database.slice(database.lastIndexOf('/') + 1),
    resource: SQLITE_RESOURCE_NAME,
  },
  [ConnectionType.Timescale]: POSTGRES_STRING,
  [Provider.CloudflareD1]: {
    label: ({ database }) => database,
    resource: SQLITE_RESOURCE_NAME,
  },
  [Provider.Turso]: {
    label: ({ host }) => host,
    resource: SQLITE_RESOURCE_NAME,
  },
}

const getEngineString = (connectionString: string) => {
  const { provider, type } = connectionParts.parse(connectionString)
  return type ? ENGINE_STRINGS[provider ?? type] : SERVER_STRING
}

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, searchParams, user } =
    readConnectionString(connectionString)
  const { defaultDatabase, label, resource } = getEngineString(connectionString)
  return {
    defaultResourceName:
      resource ?? (database || defaultDatabase?.(user) || null),
    displayUrl: label({
      address: new SafeURL(connectionString).host,
      database,
      host,
    }),
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
  if (getEngineString(connectionString).resource) {
    return connectionString
  }
  const url = new SafeURL(connectionString)
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
