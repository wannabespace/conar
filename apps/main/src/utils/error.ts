import { ORPCError } from '@orpc/client'
import type { CommonORPCErrorCode } from '@orpc/client'
import { BASE_ERROR_CODES } from 'better-auth'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'

const getErrorMessage = (error: unknown) =>
  (error instanceof ORPCError && error.message) ||
  (error as Error)?.message ||
  'Our server is practicing its meditation. Please, try again later.'

const isUnauthorizedError = (error: unknown) =>
  error instanceof ORPCError &&
  error.code === ('UNAUTHORIZED' satisfies CommonORPCErrorCode)

const isSessionExpiredError = (error: unknown) =>
  (typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    error.status === 401 &&
    error.code !== BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD.code) ||
  isUnauthorizedError(error)

export const handleError = async (error: unknown) => {
  if (!error) {
    return
  }

  const shouldIgnoreError =
    error instanceof Error
      ? error.name === 'AbortError' ||
        error.message.includes('net::') ||
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('cannot parse response body')
      : false

  if (shouldIgnoreError) {
    return
  }

  if (isSessionExpiredError(error)) {
    toast.info('Your session has expired. Please, sign in again.', {
      id: 'session-expired',
    })
    await authClient.signOut()
    return
  }

  const message = getErrorMessage(error)

  toast.error(message, { id: `error-${message}` })
}
