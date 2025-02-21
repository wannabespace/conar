import { TRPCClientError } from '@trpc/client'
import { toast } from 'sonner'
import { authClient, removeBearerToken } from '~/lib/auth'

function getErrorMessage(error: unknown) {
  return (error instanceof TRPCClientError && error.data.zodError)
    || (error as Error)?.message
    || 'Our server is practicing its meditation. Please, try again later.'
}

export async function handleError(error: unknown) {
  if (!error)
    return

  toast.error(getErrorMessage(error))

  if ((typeof error === 'object' && 'status' in error && error.status === 401) || (error instanceof TRPCClientError && error.data.code === 'UNAUTHORIZED')) {
    await Promise.all([removeBearerToken(), authClient.signOut()])
  }
}
