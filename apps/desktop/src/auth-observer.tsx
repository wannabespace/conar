import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useDeepLinksListener } from '~/deep-links'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'
import { identifyUser } from '~/lib/events'

const authRoutes = ['/sign-in', '/sign-up']
const publicRoutes = [...authRoutes]

export function AuthObserver() {
  const { refetch, isAuthenticated, isLoading, data } = useSession()
  const router = useRouter()
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (data?.user) {
      identifyUser(data.user.id, {
        email: data.user.email,
        name: data.user.name,
      })
    }
    else {
      identifyUser(null)
    }

    authClient.$store.listen('$sessionSignal', async () => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }

      const { data } = await refetch()

      if (data?.data?.user) {
        identifyUser(data.data.user.id, {
          email: data.data.user.email,
          name: data.data.user.name,
        })
      }
      else {
        identifyUser(null)
      }
    })
  }, [])

  useEffect(() => {
    if (isLoading)
      return

    if (isAuthenticated && authRoutes.includes(location.pathname)) {
      router.navigate({ to: '/' })
    }

    if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
      router.navigate({ to: '/sign-in' })
    }
  }, [isLoading, isAuthenticated, location.pathname])

  useDeepLinksListener()

  return <></>
}
