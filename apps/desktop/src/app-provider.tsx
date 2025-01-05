import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useDeepLinksListener } from './deep-links'
import { useSession } from './hooks/use-session'
import { authClient } from './lib/auth'

export function AppProvider({ children }: { children: React.ReactNode }) {
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

  useDeepLinksListener()

  return <>{children}</>
}
