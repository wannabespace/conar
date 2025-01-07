import { useRouter } from '@tanstack/react-router'
import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useDeepLinksListener } from './deep-links'
import { useSession } from './hooks/use-session'
import { authClient } from './lib/auth'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { refetch, isAuthenticated, isLoading } = useSession()
  const router = useRouter()
  const isFirstRender = useRef(true)

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', async () => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }

      toast.info('session signal')
      const { data } = await refetch()

      if (data?.data) {
        posthog.identify(data.data.user.id)
      }
      else {
        posthog.reset()
      }
    })
  }, [])

  useEffect(() => {
    if (!isLoading) {
      toast.info('redirect')
      router.navigate({ to: isAuthenticated ? '/' : '/sign-up' })
    }
  }, [isLoading, isAuthenticated])

  useDeepLinksListener()

  return <>{children}</>
}
