import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { connectionStringsCollection } from '~/entities/connection/connection-strings'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { EventsProvider } from '~/events'
import { enterAppAnimation } from '~/global-hooks'
import { useConnectionStringsSync } from '~/hooks/use-connection-strings-sync'
import { authClient } from '~/lib/auth'
import { subscriptionQueryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    await Promise.all([
      connectionStringsCollection.stateWhenReady(),
      connectionsCollection.stateWhenReady(),
      connectionsResourcesCollection.stateWhenReady(),
    ])
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { isPending } = authClient.useSession()

  useConnectionStringsSync()

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
