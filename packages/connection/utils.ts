import { SafeURL } from '@tamery/shared/safe-url'

import { isLocalNetworkHost } from './hosts'
import { sshTunnelOf } from './ssh/params'

export const isLocalNetworkConnectionString = (
  connectionString: string
): boolean => isLocalNetworkHost(new SafeURL(connectionString).hostname)

export const isSshConnectionString = (connectionString: string): boolean =>
  sshTunnelOf(new SafeURL(connectionString).searchParams) !== null
