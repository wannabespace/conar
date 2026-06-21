import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { EventsProvider } from '~/events'
import { enterAppAnimation } from '~/global-hooks'
import { authClient } from '~/lib/auth'
import { clearCollections, getCollections } from '~/lib/collections'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { subscriptionQueryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const response = await authClient.getSession().catch(() => null)

    if (!response?.data?.user) {
      throw redirect({ to: '/auth' })
    }
  },
  loader: async () => {
    const collections = getCollections()

    await connectionStringStorage.ready

    return { collections }
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) {
      return
    }

    enterAppAnimation()
  }, [isPending])

  useEffect(() => {
    const handleFocus = () => {
      subscriptionQueryClient.refetchQueries()
    }

    // Native trigger don't work for some reason, so we need to use this workaround
    window.addEventListener('focus', handleFocus)

    return () => {
      clearCollections()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <EventsProvider>
      <SubscriptionModal />
      <ActionsCenter />
      <Outlet />
    </EventsProvider>
  )
}
