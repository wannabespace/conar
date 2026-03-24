import { toastManager } from '@conar/ui/components/toast'
import { ORPCError } from '@orpc/client'
import { authClient } from '~/lib/auth'

function getErrorMessage(error: unknown) {
  return (error instanceof ORPCError && error.message)
    || (error as Error)?.message
    || 'Our server is practicing its meditation. Please, try again later.'
}

export async function handleError(error: unknown) {
  if (!error)
    return

  const shouldIgnoreError = error instanceof Error
    ? error.name === 'AbortError' || error.message.includes('net::')
    : false

  if (!shouldIgnoreError) {
    const message = getErrorMessage(error)
    toastManager.add({
      title: message,
      type: 'error',
      id: `error-${message}`,
    })
  }

  if (
    (
      typeof error === 'object'
      && 'status' in error
      && 'code' in error
      && error.status === 401
      && error.code !== 'INVALID_EMAIL_OR_PASSWORD'
      && error.code !== 'INVALID_CODE'
    )
    || (error instanceof ORPCError && error.code === 'UNAUTHORIZED')
  ) {
    await authClient.signOut()
    toastManager.add({
      title: 'Your session has expired. Please, sign in again.',
      type: 'info',
      id: 'session-expired',
    })
  }
}
