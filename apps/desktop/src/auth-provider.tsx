import { useRouter } from '@tanstack/react-router'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { env } from '~/env'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { useSession } from '~/hooks/use-session'
import { authClient, setBearerToken } from '~/lib/auth'

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

  async function listenDeepLinks() {
    if (env.VITE_PUBLIC_IS_DESKTOP) {
      try {
        return await onOpenUrl(async ([url]) => {
          const [, token] = (url || '').split('session?token=')

          if (token) {
            await setBearerToken(token)
            await refetch()
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
