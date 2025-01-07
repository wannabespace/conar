import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useDeepLinksListener } from './deep-links'
import { useSession } from './hooks/use-session'
import { authClient } from './lib/auth'
import { identifyUser } from './lib/events'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { refetch, isAuthenticated, isLoading } = useSession()
  const router = useRouter()
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', async () => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }

      const { data } = await refetch()

      identifyUser(data?.data?.user?.id || null)
    })
  }, [])

  useEffect(() => {
    if (isLoading)
      return

    const targetPath = isAuthenticated ? '/' : '/sign-up'

    if (location.pathname !== targetPath) {
      router.navigate({ to: targetPath })
    }
  }, [isLoading, isAuthenticated, location.pathname])

  useDeepLinksListener()

  return <>{children}</>
}
