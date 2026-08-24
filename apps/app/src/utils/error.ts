import { ORPCError } from '@orpc/client'
import { BASE_ERROR_CODES } from 'better-auth'
import { toast } from 'sonner'

import { fullSignOut } from '~/lib/auth'
import { router } from '~/main'

import { PROXY_ERROR_MESSAGE } from '../lib/orpc'

const getErrorMessage = (error: unknown) =>
  (error instanceof ORPCError && error.message) ||
  (error as Error)?.message ||
  'Our server is practicing its meditation. Please, try again later.'

const isSessionExpiredError = (error: unknown) =>
  (typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    error.status === 401 &&
    error.code !== BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD.code) ||
  (error instanceof ORPCError && error.code === 'UNAUTHORIZED')

export const handleError = async (error: unknown) => {
  if (!error) {
    return
  }

  const shouldIgnoreError =
    error instanceof Error
      ? error.name === 'AbortError' ||
        error.message.includes('net::') ||
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('cannot parse response body') ||
        error.message.includes(PROXY_ERROR_MESSAGE)
      : false

  if (shouldIgnoreError) {
    return
  }

  if (isSessionExpiredError(error)) {
    if (router.state.location.pathname.startsWith('/auth')) {
      return
    }

    toast.info('Your session has expired. Please, sign in again.', {
      id: 'session-expired',
    })
    await fullSignOut()
    return
  }

  const message = getErrorMessage(error)

  toast.error(
    typeof error === 'object' &&
      'status' in error &&
      typeof error.status === 'number' &&
      error.status >= 500
      ? 'Something went wrong with our server. You can continue working, but some features may not work as expected.'
      : message,
    { id: `error-${message}` }
  )
}
