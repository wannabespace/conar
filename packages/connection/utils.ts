import { isLocalNetworkHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { sshTunnelOf } from './ssh/params'

export const isLocalNetworkConnectionString = (
  connectionString: string
): boolean => isLocalNetworkHost(readConnectionString(connectionString).host)

export const isSshConnectionString = (connectionString: string): boolean =>
  sshTunnelOf(readConnectionString(connectionString).searchParams) !== null
