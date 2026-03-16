import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useEffectEvent } from 'react'
import { useSubscription } from 'seitu/react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { useChatsMessagesSync, useChatsSync } from '~/entities/chat/sync'
import { useConnectionsResourcesSync, useConnectionsSync } from '~/entities/connection/sync'
import { useQueriesSync } from '~/entities/query/sync'
import { authClient } from '~/lib/auth'
import { appStore } from '~/store'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { data } = authClient.useSession()
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })

  const { sync: syncConnections } = useConnectionsSync()
  const { sync: syncConnectionsResources } = useConnectionsResourcesSync()
  const { sync: syncQueries } = useQueriesSync()
  const { sync: syncChats } = useChatsSync()
  const { sync: syncChatsMessages } = useChatsMessagesSync()

  const sync = useEffectEvent(() => {
    syncConnections()
    syncConnectionsResources()
    syncChats()
    syncChatsMessages()
    syncQueries()
  })

  const hasUser = !!data?.user

  useEffect(() => {
    if (!hasUser || !isOnline) {
      return
    }

    sync()
  }, [hasUser, isOnline])

  return (
    <>
      <SubscriptionModal />
      <ActionsCenter />
      <Outlet />
    </>
  )
}
