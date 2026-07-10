import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { cleanCollections, getCollections } from '~/entities/collections'
import { EventsProvider } from '~/events'
import { enterAppAnimation } from '~/global-hooks'
import { useConnectionStringsSync } from '~/hooks/use-connection-strings-sync'
import { authClient } from '~/lib/auth'
import { subscriptionQueryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const c = getCollections()

    await Promise.all([
      c.connectionStringsCollection.stateWhenReady(),
      c.connectionsCollection.stateWhenReady(),
      c.connectionsResourcesCollection.stateWhenReady(),
    ])

    return { collections: c }
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { isPending } = authClient.useSession()

  useConnectionStringsSync()

  useEffect(() => {
    return () => {
      cleanCollections()
    }
  }, [])

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
