import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { getCodeChallenge, removeCodeChallenge, setBearerToken, successAuthToast } from '~/lib/auth'
import { useSession } from './hooks/use-session'
import { decrypt } from './lib/encryption'

export function useDeepLinksListener() {
  const { refetch } = useSession()

  async function handleDeepLink(url: string) {
    const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

    if (pathname === '/session') {
      await handleSession(searchParams)
    }
  }

  async function handleSession(searchParams: URLSearchParams) {
    const persistedCodeChallenge = getCodeChallenge()

    if (!persistedCodeChallenge) {
      return
    }

    const token = searchParams.get('token')
    const codeChallenge = searchParams.get('code-challenge')
    const newUser = searchParams.get('newUser')

    if (!codeChallenge || !token) {
      toast.error('We couldn\'t find your sign in token. Please try signing in again.')
      return
    }

    const decryptedCodeChallenge = await decrypt(codeChallenge, import.meta.env.VITE_PUBLIC_AUTH_SECRET)

    if (!decryptedCodeChallenge) {
      toast.error('We couldn\'t decrypt your code challenge. Please try signing in again.')
      return
    }

    if (decryptedCodeChallenge !== persistedCodeChallenge) {
      toast.error('Your sign in token has already been used. Please try signing in again.')
      return
    }

    setBearerToken(token)
    await refetch()
    removeCodeChallenge()
    successAuthToast(!!newUser)
  }

  useAsyncEffect(async () => {
    if (window.initialDeepLink) {
      handleDeepLink(window.initialDeepLink)
      window.initialDeepLink = null
    }

    window.electron.app.onDeepLink(async (url) => {
      await handleDeepLink(url)
    })
  }, [])
}
