import { NETWORK_ERROR_PATTERNS } from '../constants'

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return NETWORK_ERROR_PATTERNS.some(pattern => msg.includes(pattern))
  }
  return false
}
