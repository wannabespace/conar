import { useRouter } from '@tanstack/react-router'
import { isTauri } from '@tauri-apps/api/core'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from '~/hooks/use-async-effect'
import { useSession } from '~/hooks/use-session'
import { authClient, getCodeChallenge, removeCodeChallenge, setBearerToken } from '~/lib/auth'
import { env } from './env'
import { createEncryptor } from './lib/secrets'

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

  async function handleSession(searchParams: URLSearchParams) {
    const token = searchParams.get('token')
    const codeChallenge = searchParams.get('key')
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
    if (isTauri()) {
      try {
        return await onOpenUrl(async ([url]) => {
          const { pathname, searchParams } = new URL(url.replace('connnect://', 'https://connnect.app/'))

          if (pathname === '/session') {
            await handleSession(searchParams)
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
