import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { clearCollectionsCache, getCollections } from '~/lib/collections'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { subscriptionQueryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const collections = getCollections()

    await Promise.all(Object.values(collections)
      .filter(collection => 'toArrayWhenReady' in collection)
      .map(collection => collection.toArrayWhenReady()))

    await connectionStringStorage.ready
    await connectionStringStorage.resolved()

    return { collections }
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  useEffect(() => {
    const handleFocus = () => {
      subscriptionQueryClient.refetchQueries()
    }

    // Native trigger don't work for some reason, so we need to use this workaround
    window.addEventListener('focus', handleFocus)

    return () => {
      clearCollectionsCache()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <>
      <SubscriptionModal />
      <ActionsCenter />
      <Outlet />
    </>
  )
}
