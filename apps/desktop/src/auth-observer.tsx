import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { identifyUser } from '~/lib/events'
import { authClient, bearerToken } from './lib/auth'
import { handleDeepLink } from './lib/deep-links'

const authRoutes = ['/sign-in', '/sign-up']
const publicRoutes = [...authRoutes]

export function AuthObserver() {
  const { data, error, isPending, refetch } = authClient.useSession()
  const router = useRouter()
  const location = useLocation()

  const isSignedInButServerError = !!bearerToken.get() && !!error

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

    /**
     * An error can be only on the server side
     * To not block the app, we navigate to the home page to continue working
     */
    if (isSignedInButServerError) {
      if (authRoutes.includes(location.pathname))
        router.navigate({ to: '/' })

      return
    }

    if (data?.user && authRoutes.includes(location.pathname)) {
      router.navigate({ to: '/' })
    }

    if (!data?.user && !publicRoutes.includes(location.pathname)) {
      router.navigate({ to: '/sign-in' })
    }
  }, [router, isPending, data?.user, location.pathname, isSignedInButServerError])

  useEffect(() => {
    if (isSignedInButServerError)
      toast.error('Something went wrong with our server. You can continue working, but some features may not work as expected.')
  }, [isSignedInButServerError])

  async function handle(url: string) {
    const { type } = await handleDeepLink(url)

    if (type === 'session') {
      refetch()
    }
  }

  useAsyncEffect(async () => {
    if (window.initialDeepLink) {
      handle(window.initialDeepLink)

      window.initialDeepLink = null
    }

    const cleanup = window.electron?.app.onDeepLink(handle)
    return cleanup
  }, [])

  return <></>
}
