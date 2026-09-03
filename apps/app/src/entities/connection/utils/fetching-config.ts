import { SyncType } from '@tamery/shared/enums/sync-type'

import type { Connection } from '~/entities/connection/core'

import { isLocalProxyAvailable } from '../runtime/proxy'

type FetchingType =
  | 'cloud-proxy'
  | 'local'
  | 'proxy'
  | 'resolving-password'
  | 'waiting-for-password'

export interface FetchingConfig {
  type: FetchingType
  canSend: boolean
  reason: string | null
}

type FetchingConnection = Pick<Connection, 'syncType' | 'isPasswordExists'>

interface FetchingOptions {
  isLocalProxyAvailable?: boolean
  isPasswordPopulated?: boolean
  isLocalhost?: boolean
  proxy?: { enabled: boolean; url: string | null }
}

const REASONS = {
  localhostFromWeb:
    'You cannot reach this connection from the web app. Run `tamery proxy` or open this connection in the desktop app.',
  passwordMissingInDesktop:
    'Filled password is required to query this connection.',
  passwordMissingInWeb:
    'This connection cannot be used from the web app because it was created without storing the password. Open this connection in the desktop app.',
  passwordNotStored:
    'You cannot reach this connection from the web app. Open this connection in the desktop app.',
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
  options?: FetchingOptions
) => {
  const isElectron = !!window.electron
  const { isPasswordPopulated } = options ?? {}

  return {
    hasPassword:
      connection.syncType === SyncType.Cloud || !!isPasswordPopulated,
    isElectron,
    isLocalhost: options?.isLocalhost ?? false,
    needsPassword: connection.isPasswordExists && isPasswordPopulated === false,
    passwordUnresolved:
      connection.isPasswordExists && isPasswordPopulated === undefined,
    proxyPreferred: !isElectron || options?.proxy?.enabled === true,
    proxyReachable:
      (options?.isLocalProxyAvailable ?? isLocalProxyAvailable()) ||
      !!options?.proxy?.url,
  }
}

export const fetchingConfig = (
  connection: FetchingConnection,
  options?: FetchingOptions
): FetchingConfig => {
  const {
    hasPassword,
    isElectron,
    isLocalhost,
    needsPassword,
    passwordUnresolved,
    proxyPreferred,
    proxyReachable,
  } = resolveFlags(connection, options)

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

  if ((isLocalhost || hasPassword) && proxyReachable && proxyPreferred) {
    return allowed('proxy')
  }

  if (isElectron) {
    return allowed('local')
  }

  if (isLocalhost) {
    return blocked('proxy', REASONS.localhostFromWeb)
  }

  if (connection.syncType === SyncType.CloudWithoutPassword) {
    return blocked('cloud-proxy', REASONS.passwordNotStored)
  }

  return allowed('cloud-proxy')
}
