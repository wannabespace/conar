import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'

/** IPv4 addresses in 127.0.0.0/8 (often used like localhost). */
const LOCALHOST_IPV4 = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

export function isLocalhostConnectionString(connectionString: string): boolean {
  const hostname = new SafeURL(connectionString).hostname.toLowerCase()
  return (
    hostname === 'localhost'
    || hostname === '::1'
    || hostname === '[::1]'
    || LOCALHOST_IPV4.test(hostname)
  )
}

export function canSendQueryInCloud({
  syncType,
  connectionString,
  isPasswordExists,
}: {
  syncType: SyncType
  connectionString: string
  isPasswordExists: boolean
}) {
  if (syncType === SyncType.CloudWithoutPassword && isPasswordExists) {
    return false
  }
  return !isLocalhostConnectionString(connectionString)
}
