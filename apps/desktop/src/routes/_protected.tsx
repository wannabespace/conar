import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent } from 'react'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { useChatsMessagesSync, useChatsSync } from '~/entities/chat/sync'
import { useDatabasesSync } from '~/entities/database/sync'
import { useQueriesSync } from '~/entities/query/sync'
import { authClient } from '~/lib/auth'
import { appStore } from '~/store'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { data } = authClient.useSession()
  const isOnline = useStore(appStore, state => state.isOnline)

  const { sync: syncDatabases } = useDatabasesSync()
  const { sync: syncQueries } = useQueriesSync()
  const { sync: syncChats } = useChatsSync()
  const { sync: syncChatsMessages } = useChatsMessagesSync()

  const sync = useEffectEvent(() => {
    syncDatabases()
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
