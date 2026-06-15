import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { authClient } from '~/lib/auth'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { subscriptionQueryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    await Promise.all([
      connectionsCollection.toArrayWhenReady(),
      connectionsResourcesCollection.toArrayWhenReady(),
      connectionStringStorage.ready,
    ])
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { data } = authClient.useSession()

  const isSignedIn = !!data?.user

  useEffect(() => {
    if (!isSignedIn) {
      return
    }

    const handleFocus = () => {
      subscriptionQueryClient.refetchQueries()
    }

    // Native trigger don't work for some reason, so we need to use this workaround
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [isSignedIn])

  return (
    <>
      <SubscriptionModal />
      <ActionsCenter />
      <Outlet />
    </>
  )
}
