import { toast } from 'sonner'
import { bearerToken, codeChallenge, successAuthToast } from '~/lib/auth'
import { decrypt } from './encryption'

export async function handleDeepLink(url: string): Promise<{ type: 'session' | 'unknown' }> {
  const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

  if (pathname === '/session') {
    await handleSession(searchParams)

    return {
      type: 'session',
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
