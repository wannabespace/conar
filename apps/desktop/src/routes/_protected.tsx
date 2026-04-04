import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat/sync'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { queriesCollection } from '~/entities/query/sync'
import { authClient } from '~/lib/auth'
import { appStore } from '~/store'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { data } = authClient.useSession()
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })

  const hasUser = !!data?.user

  useEffect(() => {
    if (!hasUser || !isOnline) {
      return
    }

    connectionsCollection.utils.runSync()
    connectionsResourcesCollection.utils.runSync()
    chatsCollection.utils.runSync()
    chatsMessagesCollection.utils.runSync()
    queriesCollection.utils.runSync()
  }, [hasUser, isOnline])

  return (
    <>
      <SubscriptionModal />
      <ActionsCenter />
      <Outlet />
    </>
  )
}
