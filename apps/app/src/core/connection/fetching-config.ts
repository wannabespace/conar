import { isInternalHost } from '@tamery/connection/hosts'
import { SSH_DESKTOP_ONLY } from '@tamery/connection/ssh/params'
import { SyncType } from '@tamery/shared/enums/sync-type'

import type { ConnectionString } from '~/core/connection/connection-strings'
import type { Connection } from '~/core/connection/sync'
import { isLocalProxyAvailable } from '~/core/runtime/proxy'

type FetchingType =
  | 'cloud-proxy'
  | 'local'
  | 'proxy'
  | 'resolving-password'
  | 'waiting-for-details'
  | 'waiting-for-password'

export interface FetchingConfig {
  type: FetchingType
  canSend: boolean
  reason: string | null
}

type FetchingConnection = Pick<Connection, 'syncType' | 'isPasswordExists'>

interface FetchingOptions {
  /** `undefined` while the row loads leaves the password unresolved. */
  connectionString:
    | Pick<
        ConnectionString,
        'displayUrl' | 'isPasswordPopulated' | 'missingSecrets' | 'usesSsh'
      >
    | null
    | undefined
  isLocalProxyAvailable?: boolean
  proxy?: { enabled: boolean; url: string | null }
}

const PORT_SUFFIX = /:\d*$/u

export const isInternalConnection = ({
  displayUrl,
}: Pick<ConnectionString, 'displayUrl'>) =>
  isInternalHost(displayUrl.replace(PORT_SUFFIX, ''))

const REASONS = {
  connectionStringNotStored:
    'Only the name and color of this connection sync. Add its server details on this device to use it here.',
  internalFromWeb:
    'You cannot reach this connection from the web app. Run `tamery proxy` or open this connection in the desktop app.',
  passwordMissingInDesktop:
    'Filled password is required to query this connection.',
  passwordMissingInWeb:
    'This connection cannot be used from the web app because it was created without storing the password. Open this connection in the desktop app.',
  passwordNotStored:
    'You cannot reach this connection from the web app. Open this connection in the desktop app.',
  secretsMissing:
    'Enter the SSH or SSL credentials this device has not saved yet to query this connection.',
}

const allowed = (type: FetchingType): FetchingConfig => ({
  canSend: true,
  reason: null,
  type,
})

const blocked = (
  type: FetchingType,
  reason: string | null = null
): FetchingConfig => ({
  canSend: false,
  reason,
  type,
})

const resolveFlags = (
  connection: FetchingConnection,
  options: FetchingOptions
) => {
  const isElectron = !!window.electron
  const { connectionString } = options
  const isPasswordPopulated = connectionString?.isPasswordPopulated

  return {
    connectionStringMissing:
      connection.syncType === SyncType.CloudWithoutConnectionString &&
      !connectionString,
    hasPassword:
      connection.syncType === SyncType.Cloud || !!isPasswordPopulated,
    isElectron,
    isInternal: !!connectionString && isInternalConnection(connectionString),
    missingSecrets: connectionString?.missingSecrets ?? [],
    needsPassword: connection.isPasswordExists && isPasswordPopulated === false,
    passwordUnresolved:
      connection.isPasswordExists && isPasswordPopulated === undefined,
    proxyPreferred: !isElectron || options.proxy?.enabled === true,
    proxyReachable:
      (options.isLocalProxyAvailable ?? isLocalProxyAvailable()) ||
      !!options.proxy?.url,
    usesSsh: !!connectionString?.usesSsh,
  }
}

export const fetchingConfig = (
  connection: FetchingConnection,
  options: FetchingOptions
): FetchingConfig => {
  const {
    connectionStringMissing,
    hasPassword,
    isElectron,
    isInternal,
    missingSecrets,
    needsPassword,
    passwordUnresolved,
    proxyPreferred,
    proxyReachable,
    usesSsh,
  } = resolveFlags(connection, options)

  if (connectionStringMissing) {
    return blocked('waiting-for-details', REASONS.connectionStringNotStored)
  }

  if (usesSsh && !isElectron) {
    return blocked('local', SSH_DESKTOP_ONLY)
  }

  if (passwordUnresolved) {
    return blocked('resolving-password')
  }

  if (needsPassword) {
    return blocked(
      'waiting-for-password',
      isElectron
        ? REASONS.passwordMissingInDesktop
        : REASONS.passwordMissingInWeb
    )
  }

  if (missingSecrets.length > 0) {
    return blocked('waiting-for-password', REASONS.secretsMissing)
  }

  if (usesSsh) {
    return allowed('local')
  }

  if ((isInternal || hasPassword) && proxyReachable && proxyPreferred) {
    return allowed('proxy')
  }

  if (isElectron) {
    return allowed('local')
  }

  if (isInternal) {
    return blocked('proxy', REASONS.internalFromWeb)
  }

  if (connection.syncType !== SyncType.Cloud) {
    return blocked('cloud-proxy', REASONS.passwordNotStored)
  }

  return allowed('cloud-proxy')
}
