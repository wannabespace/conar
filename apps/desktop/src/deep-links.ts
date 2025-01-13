import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { getCodeChallenge, removeCodeChallenge, setBearerToken, successToast } from '~/lib/auth'
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

    const urls = (await getCurrent()) || []

    if (urls.length === 0)
      return

    const [url] = urls

    await handleDeepLink(url)
  }, [])

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

    const encryptor = await createEncryptor(env.VITE_PUBLIC_AUTH_SECRET).catch((e) => {
      console.error(e)
      return null
    })

    if (!encryptor) {
      toast.error('Something went wrong. Please try signing in again.')
      return
    }

    const decryptedCodeChallenge = await encryptor.decrypt(codeChallenge).catch((e) => {
      console.error(e)
      return null
    })

    if (!decryptedCodeChallenge) {
      toast.error('We couldn\'t decrypt your code challenge. Please try signing in again.')
      return
    }

    if (decryptedCodeChallenge !== persistedCodeChallenge) {
      toast.error('Your sign in token has already been used. Please try signing in again.')
      return
    }

    await setBearerToken(token)
    await refetch()
    removeCodeChallenge()
    successToast(!!newUser)
  }

  async function listenDeepLinks() {
    return onOpenUrl(async ([url]) => {
      await getCurrentWindow().setFocus()
      await getCurrentWindow().unminimize()
      await handleDeepLink(url)
    })
  }

  useAsyncEffect(async () => {
    if (isTauri()) {
      return listenDeepLinks()
    }
  }, [])
}
