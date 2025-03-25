import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { identifyUser } from '~/lib/events'
import { useAsyncEffect } from './hooks/use-async-effect'
import { authClient } from './lib/auth'
import { handleDeepLink } from './lib/deep-links'

const authRoutes = ['/sign-in', '/sign-up']
const publicRoutes = [...authRoutes]

export function AuthObserver() {
  const { data, isPending, refetch } = authClient.useSession()
  const router = useRouter()
  const location = useLocation()

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
  }, [data?.user])

  useEffect(() => {
    if (isPending)
      return

    if (data?.user && authRoutes.includes(location.pathname)) {
      router.navigate({ to: '/' })
    }

    if (!data?.user && !publicRoutes.includes(location.pathname)) {
      router.navigate({ to: '/sign-in' })
    }
  }, [isPending, data?.user, location.pathname])

  useAsyncEffect(async () => {
    if (window.initialDeepLink) {
      const { type } = await handleDeepLink(window.initialDeepLink)

      if (type === 'session') {
        refetch()
      }

      window.initialDeepLink = null
    }

    window.electron.app.onDeepLink(async (url) => {
      const { type } = await handleDeepLink(url)

      if (type === 'session') {
        refetch()
      }
    })
  }, [])

  return <></>
}
