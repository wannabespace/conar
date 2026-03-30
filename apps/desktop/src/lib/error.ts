import { ORPCError } from '@orpc/client'
import { BASE_ERROR_CODES } from 'better-auth'
import { toast } from 'sonner'
import { fullSignOut } from '~/lib/auth'

function getErrorMessage(error: unknown) {
  return (error instanceof ORPCError && error.message)
    || (error as Error)?.message
    || 'Our server is practicing its meditation. Please, try again later.'
}

export async function handleError(error: unknown) {
  if (!error)
    return

  const shouldIgnoreError = error instanceof Error
    ? error.name === 'AbortError' || error.message.includes('net::') || error.message.toLowerCase().includes('failed to fetch')
    : false

  if (!shouldIgnoreError) {
    const message = getErrorMessage(error)
    toast.error(message, {
      id: `error-${message}`,
    })
  }

  if (
    (
      typeof error === 'object'
      && 'status' in error
      && 'code' in error
      && error.status === 401
      && error.code !== BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD.code
    )
    || (error instanceof ORPCError && error.code === 'UNAUTHORIZED')
  ) {
    await fullSignOut()
    toast.info('Your session has expired. Please, sign in again.', {
      id: 'session-expired',
    })
  }
}
