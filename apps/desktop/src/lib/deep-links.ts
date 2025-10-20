import { toast } from 'sonner'
import { bearerToken, codeChallenge, resetToken, successAuthToast } from '~/lib/auth'
import { decrypt } from './encryption'

export async function handleDeepLink(url: string): Promise<{
  type:
    | 'session'
    | 'reset-password'
    | 'unknown'
}> {
  const { pathname, searchParams } = new URL(url.replace('conar://', 'https://conar.app/'))

  if (pathname === '/session') {
    await handleSession(searchParams)

    return {
      type: 'session',
    }
  }

  if (pathname === '/reset-password') {
    await handleResetPassword(searchParams)

    return {
      type: 'reset-password',
    }
  }

  return {
    type: 'unknown',
  }
}

export async function handleSession(searchParams: URLSearchParams) {
  const persistedCodeChallenge = codeChallenge.get()

  if (!persistedCodeChallenge) {
    return
  }

  const token = searchParams.get('token')
  const code = searchParams.get('code-challenge')
  const newUser = searchParams.get('new-user')

  if (!code || !token) {
    toast.error('We couldn\'t find your sign in token. Please try signing in again.')
    return
  }

  const decryptedCodeChallenge = await decrypt(code, import.meta.env.VITE_PUBLIC_AUTH_SECRET)

  if (!decryptedCodeChallenge) {
    toast.error('We couldn\'t decrypt your code challenge. Please try signing in again.')
    return
  }

  if (decryptedCodeChallenge !== persistedCodeChallenge) {
    toast.error('Your sign in token has already been used. Please try signing in again.')
    return
  }

  bearerToken.set(token)
  codeChallenge.remove()
  successAuthToast(!!newUser)
}

export async function handleResetPassword(searchParams: URLSearchParams) {
  const token = searchParams.get('token')

  if (!token) {
    toast.error('Invalid reset password link', {
      description: 'Please request a new password reset link.',
    })
    return
  }

  resetToken.set(token)
}
