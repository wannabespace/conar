import { isInternalHost } from './hosts'
import { readConnectionString } from './parse-connection-string'
import { sshTunnelOf } from './ssh/params'

export const isInternalConnectionString = (connectionString: string): boolean =>
  isInternalHost(readConnectionString(connectionString).host)

export const isSshConnectionString = (connectionString: string): boolean =>
  sshTunnelOf(readConnectionString(connectionString).searchParams) !== null
