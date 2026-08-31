import { SyncType } from '@tamery/shared/enums/sync-type'

import type { Connection } from '~/entities/connection/core'

import { isLocalProxyAvailable } from '../runtime/proxy'

const waitingForPasswordConfig = (): {
  type: 'waiting-for-password'
  canSend: false
  reason: string
} => ({
  canSend: false,
  reason: window.electron
    ? 'Filled password is required to query this connection.'
    : 'This connection cannot be used from the web app because it was created without storing the password. Open this connection in the desktop app.',
  type: 'waiting-for-password',
})

const cloudProxyConfig = (
  connection: Pick<Connection, 'syncType'>
): {
  type: 'cloud-proxy'
  canSend: boolean
  reason: string | null
} => {
  const canSend = connection.syncType !== SyncType.CloudWithoutPassword

  return {
    canSend,
    reason: canSend
      ? null
      : 'You cannot reach this connection from the web app. Open this connection in the desktop app.',
    type: 'cloud-proxy',
  }
}

const isPasswordFilledForConnection = (
  connection: Pick<Connection, 'syncType'>,
  isPasswordPopulated: boolean
) =>
  (connection.syncType === SyncType.CloudWithoutPassword &&
    isPasswordPopulated) ||
  connection.syncType === SyncType.Cloud

const resolveReachableConfig = ({
  connection,
  hasCustomUrl,
  isLocalhost,
  isPasswordFilled,
  preferProxy,
  proxyAvailable,
}: {
  connection: Pick<Connection, 'syncType'>
  hasCustomUrl: boolean
  isLocalhost: boolean
  isPasswordFilled: boolean
  preferProxy: boolean
  proxyAvailable: boolean
}): {
  type: 'cloud-proxy' | 'local' | 'proxy'
  canSend: boolean
  reason: string | null
} => {
  if (
    (isLocalhost || isPasswordFilled) &&
    (proxyAvailable || hasCustomUrl) &&
    preferProxy
  ) {
    return { canSend: true, reason: null, type: 'proxy' }
  }

  if (window.electron) {
    return { canSend: true, reason: null, type: 'local' }
  }

  if (isLocalhost) {
    return {
      canSend: false,
      reason:
        'You cannot reach this connection from the web app. Run `tamery proxy` or open this connection in the desktop app.',
      type: 'proxy',
    }
  }

  return cloudProxyConfig(connection)
}

export const fetchingConfig = (
  connection: Pick<Connection, 'syncType' | 'isPasswordExists'>,
  options?: {
    isLocalProxyAvailable?: boolean
    isPasswordPopulated?: boolean
    isLocalhost?: boolean
    proxy?: { enabled: boolean; url: string | null }
  }
): {
  type: 'cloud-proxy' | 'local' | 'proxy' | 'waiting-for-password'
  canSend: boolean
  reason: string | null
} => {
  const isPasswordPopulated = options?.isPasswordPopulated ?? false
  const isLocalhost = options?.isLocalhost ?? false

  if (connection.isPasswordExists && !isPasswordPopulated) {
    return waitingForPasswordConfig()
  }

  return resolveReachableConfig({
    connection,
    hasCustomUrl: !!options?.proxy?.url,
    isLocalhost,
    isPasswordFilled: isPasswordFilledForConnection(
      connection,
      isPasswordPopulated
    ),
    preferProxy: !window.electron || options?.proxy?.enabled === true,
    proxyAvailable: options?.isLocalProxyAvailable ?? isLocalProxyAvailable(),
  })
}
