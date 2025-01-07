import { isTauri } from '@tauri-apps/api/core'
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { getCodeChallenge, removeCodeChallenge, setBearerToken } from '~/lib/auth'
import { env } from './env'
import { useSession } from './hooks/use-session'
import { createEncryptor } from './lib/secrets'

export function useDeepLinksListener() {
  const { refetch } = useSession()

  async function handleDeepLink(url: string) {
    const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

    if (pathname === '/session') {
      await handleSession(searchParams)
    }
  }

  useAsyncEffect(async () => {
    if (!isTauri())
      return

    const urls = await getCurrent()

    if (!urls || urls.length === 0) {
      return
    }

    const [url] = urls

    await handleDeepLink(url)
  }, [])

  async function handleSession(searchParams: URLSearchParams) {
    const token = searchParams.get('token')
    const codeChallenge = searchParams.get('code-challenge')
    const newUser = searchParams.get('newUser')

    if (!codeChallenge || !token) {
      return
    }

    const encryptor = await createEncryptor(env.VITE_PUBLIC_AUTH_SECRET)
    const persistedCodeChallenge = getCodeChallenge()

    if (!persistedCodeChallenge) {
      toast.error('No code challenge found')
      return
    }

    const decryptedCodeChallenge = await encryptor.decrypt(codeChallenge)

    if (decryptedCodeChallenge !== persistedCodeChallenge) {
      toast.error('Invalid code challenge')
      return
    }

    await setBearerToken(token)
    await refetch()
    removeCodeChallenge()

    toast.success(
      newUser
        ? 'Welcome to Connnect! We\'re excited to help you manage your databases with ease. Get started by creating your first connection.'
        : 'Welcome back! Your database connections are ready for you.',
    )
  }

  async function listenDeepLinks() {
    return onOpenUrl(async ([url]) => handleDeepLink(url))
  }

  useAsyncEffect(async () => {
    if (isTauri()) {
      return listenDeepLinks()
    }
  }, [])
}
