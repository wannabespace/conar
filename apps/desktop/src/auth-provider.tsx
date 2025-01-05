import { useRouter } from '@tanstack/react-router'
import { isTauri } from '@tauri-apps/api/core'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { useSession } from '~/hooks/use-session'
import { authClient, getCodeChallenge, parseCodeChallenge, removeCodeChallenge, setBearerToken } from '~/lib/auth'

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

  async function sessionHandler(token: string, codeChallenge: string) {
    const persistedCodeChallenge = await getCodeChallenge()

    if (persistedCodeChallenge !== await parseCodeChallenge(codeChallenge)) {
      toast.error('Invalid code challenge')
      return
    }

    await setBearerToken(token)
    await refetch()
    removeCodeChallenge()
  }

  async function listenDeepLinks() {
    if (isTauri()) {
      try {
        return await onOpenUrl(async ([url]) => {
          const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

          if (pathname === '/session') {
            const codeChallenge = searchParams.get('key')
            const token = searchParams.get('token')

            if (!codeChallenge || !token) {
              toast.error('No code challenge or token found')
              return
            }

            await sessionHandler(token, codeChallenge)
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
