import { COMMON_ERROR_STATUS_MAP, ORPCError } from '@orpc/client'
import { PROXY_ERROR_MESSAGE } from '@tamery/shared/constants'
import { BASE_ERROR_CODES } from 'better-auth'
import { toast } from 'sonner'

import { fullSignOut, isAnonymous } from '~/lib/auth'
import { isAuthLocation } from '~/lib/last-location'
import { promptSignIn } from '~/store'

const getErrorMessage = (error: unknown) =>
  (error instanceof ORPCError && error.message) ||
  (error as Error)?.message ||
  'Our server is practicing its meditation. Please, try again later.'

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ORPCError && error.code === 'UNAUTHORIZED'

const isSessionExpiredError = (error: unknown) =>
  (typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    error.status === 401 &&
    error.code !== BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD.code) ||
  isUnauthorizedError(error)

const errorStatus: Record<string, number | undefined> = COMMON_ERROR_STATUS_MAP

const isServerError = (error: unknown) =>
  error instanceof ORPCError
    ? (errorStatus[error.code] ?? 500) >= 500
    : typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number' &&
      error.status >= 500

export const handleError = async (
  error: unknown,
  { context }: { context?: { silent?: boolean } } = {}
) => {
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
    if (isAuthLocation()) {
      return
    }

    toast.info('Your session has expired. Please, sign in again.', {
      id: 'session-expired',
    })
    await fullSignOut()
    return
  }

  if (context?.silent) {
    return
  }

  if (
    error instanceof ORPCError &&
    error.code === 'FORBIDDEN' &&
    isAnonymous() &&
    !isAuthLocation()
  ) {
    promptSignIn(error.message)
    return
  }

  const message = getErrorMessage(error)

  toast.error(
    isServerError(error)
      ? 'Something went wrong with our server. You can continue working, but some features may not work as expected.'
      : message,
    { id: `error-${message}` }
  )
}
