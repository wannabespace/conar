import { useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { authClient, bearerToken } from './lib/auth'
import { router } from './main'
import { appStore } from './store'

export function AuthObserver() {
  const { data, error, isPending } = authClient.useSession()
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })

  const hasUser = !!data?.user
  const hasError = !!error

  useEffect(() => {
    if (isPending)
      return

    /**
     * An error can be only on the server side
     * To not block the app, we navigate to the home page to continue working
     */
    if (!!bearerToken.get() && hasError) {
      if (match === '/auth')
        router.navigate({ to: '/' })

      return
    }

    console.log(isPending, hasUser, match, hasError)

    if (hasUser && match === '/auth') {
      router.navigate({ to: '/' })
    }

    if (!hasUser && match !== '/auth') {
      router.navigate({ to: '/auth' })
    }
  }, [isPending, hasUser, match, hasError])

  useEffect(() => {
    if (!!bearerToken.get() && !!error && isOnline) {
      toast.error('Something went wrong with our server. You can continue working, but some features may not work as expected.', {
        id: 'server-error',
      })
    }
  }, [isOnline, error])

  return <></>
}
