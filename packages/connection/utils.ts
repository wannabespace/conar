import { SafeURL } from '@tamery/shared/safe-url'

import { isLocalHost } from './hosts'
import { sshTunnelOf } from './ssh/params'

export const isLocalhostConnectionString = (
  connectionString: string
): boolean => isLocalHost(new SafeURL(connectionString).hostname)

export const isSshConnectionString = (connectionString: string): boolean =>
  sshTunnelOf(new SafeURL(connectionString).searchParams) !== null
