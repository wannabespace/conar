import { SafeURL } from '@tamery/shared/safe-url'

import {
  parseConnectionString,
  readConnectionString,
} from './parse-connection-string'
import { connectionSecrets } from './secrets'
import { sshTunnelOf } from './ssh/params'

export const isSshConnectionString = (connectionString: string): boolean =>
  sshTunnelOf(readConnectionString(connectionString).searchParams) !== null

export const describeConnectionString = (connectionString: string) => {
  const { database, password, searchParams } =
    parseConnectionString(connectionString)
  return {
    defaultResourceName: database ?? null,
    displayUrl: new SafeURL(connectionString).host,
    isPasswordPopulated: !!password,
    missingSecrets: connectionSecrets.missing(searchParams),
    usesSsh: sshTunnelOf(searchParams) !== null,
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
