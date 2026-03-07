import { useMatches, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { identifyUser } from '~/lib/events-utils'
import { authClient, bearerToken } from './lib/auth'
import { appStore } from './store'

export function AuthObserver() {
  const { data, error, isPending } = authClient.useSession()
  const router = useRouter()
  const isOnline = useStore(appStore, state => state.isOnline)
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })

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
    if (!!bearerToken.get() && !!error) {
      if (match === '/auth')
        router.navigate({ to: '/' })

      return
    }

    if (data?.user && match === '/auth') {
      router.navigate({ to: '/' })
    }

    if (!data?.user && match !== '/auth') {
      router.navigate({ to: '/auth' })
    }
  }, [router, isPending, data?.user, match, error])

  useEffect(() => {
    if (!!bearerToken.get() && !!error && isOnline) {
      toast.error('Something went wrong with our server. You can continue working, but some features may not work as expected.', {
        id: 'server-error',
      })
    }
  }, [isOnline, error])

  return <></>
}
