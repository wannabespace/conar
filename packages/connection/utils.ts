import { SafeURL } from '@tamery/shared/safe-url'

import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { SSH_PARAMS } from './ssh/params'

export const describeConnectionString = (connectionString: string) => {
  const { database, host, password, searchParams } =
    readConnectionString(connectionString)
  return {
    defaultResourceName: database || null,
    displayUrl: new SafeURL(connectionString).host,
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
  url.pathname = encodeURIComponent(resourceName ?? '')
  return url.toString()
}
