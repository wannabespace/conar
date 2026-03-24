import { toastManager } from '@conar/ui/components/toast'
import { useMatches, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { identifyUser } from '~/lib/events-utils'
import { authClient, bearerToken } from './lib/auth'
import { appStore } from './store'

export function AuthObserver() {
  const { data, error, isPending } = authClient.useSession()
  const router = useRouter()
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })
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
      toastManager.add({
        type: 'error',
        title: 'Something went wrong with our server. You can continue working, but some features may not work as expected.',
        id: 'server-error',
      })
    }
  }, [isOnline, error])

  return <></>
}
