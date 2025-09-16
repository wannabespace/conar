import { ORPCError } from '@orpc/client'
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

  toast.error(getErrorMessage(error))

  if (
    (
      typeof error === 'object'
      && 'status' in error
      && 'code' in error
      && error.status === 401
      && error.code !== 'INVALID_EMAIL_OR_PASSWORD'
    )
    || (error instanceof ORPCError && error.code === 'UNAUTHORIZED')
  ) {
    await fullSignOut()
    toast.info('Your session has expired. Please, sign in again.')
  }
}
