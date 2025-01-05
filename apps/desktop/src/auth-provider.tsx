import { useRouter } from '@tanstack/react-router'
import { isTauri } from '@tauri-apps/api/core'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { useSession } from '~/hooks/use-session'
import { authClient, getCodeChallenge, removeCodeChallenge, setBearerToken } from '~/lib/auth'
import { env } from './env'
import { secretParse } from './lib/secrets'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refetch, isAuthenticated, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', () => refetch())
  }, [])

  useEffect(() => {
    if (!isLoading) {
      router.navigate({ to: isAuthenticated ? '/' : '/sign-in' })
    }
  }, [isLoading, isAuthenticated])

  async function handleSession(token: string, codeChallenge: string) {
    const persistedCodeChallenge = getCodeChallenge()

    if (!persistedCodeChallenge) {
      toast.error('No code challenge found')
      return
    }

    const decryptedCodeChallenge = await secretParse(codeChallenge, env.VITE_PUBLIC_AUTH_SECRET)

    if (decryptedCodeChallenge !== persistedCodeChallenge) {
      toast.error('Invalid code challenge')
      return
    }

    if (token) {
      await setBearerToken(token)
      await refetch()
      removeCodeChallenge()
    }
  }

  async function listenDeepLinks() {
    if (isTauri()) {
      try {
        return await onOpenUrl(async ([url]) => {
          const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

          if (pathname === '/session') {
            const token = searchParams.get('token')
            const codeChallenge = searchParams.get('key')

            if (!codeChallenge || !token) {
              return
            }

            await handleSession(token, codeChallenge)
          }
        })
      }
      catch {
        // Nothing to do - error can only occur if app is opened in browser
      }
    }
  }

  useAsyncEffect(() => {
    return listenDeepLinks()
  }, [])

  return (
    <>
      {children}
    </>
  )
}
