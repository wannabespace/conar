import { SafeURL } from '@tamery/shared/safe-url'

const LOCALHOST_IPV4 = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u

export const isLocalhostConnectionString = (
  connectionString: string
): boolean => {
  const hostname = new SafeURL(connectionString).hostname.toLowerCase()
  return (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    LOCALHOST_IPV4.test(hostname)
  )
}
