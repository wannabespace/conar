import { useNetwork } from '@conar/ui/hookas/use-network'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect, useEffectEvent } from 'react'
import { useChatsMessagesSync, useChatsSync } from '~/entities/chat/sync'
import { useDatabasesSync } from '~/entities/database'
import { useQueriesSync } from '~/entities/query/sync'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/(protected)/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { data } = authClient.useSession()
  const router = useRouter()
  const { online } = useNetwork()

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
    if (!hasUser || !online) {
      return
    }

    sync()
  }, [hasUser, online])

  useEffect(() => {
    const handler = (path: string) => {
      router.navigate({ to: path })
    }

    const cleanup = window.electron?.app.onNavigate(handler)
    return cleanup
  }, [router])

  return (
    <>
      <ActionsCenter />
      <Outlet />
    </>
  )
}
