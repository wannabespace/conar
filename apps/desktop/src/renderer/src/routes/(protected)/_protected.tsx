import { getOS } from '@conar/shared/utils/os'
import { useNetwork } from '@conar/ui/hookas/use-network'
import { useKeyboardEvent } from '@react-hookz/web'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { syncChatsQueryOptions } from '~/entities/chat/lib/sync'
import { syncDatabasesQueryOptions } from '~/entities/database'
import { syncQueriesQueryOptions } from '~/entities/query/lib/sync'
import { authClient } from '~/lib/auth'
import { queryClient } from '~/main'
import { ActionsCenter } from './-components/actions-center'

const os = getOS(navigator.userAgent)

export const Route = createFileRoute('/(protected)/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { data } = authClient.useSession()
  const router = useRouter()
  const { online } = useNetwork()

  useEffect(() => {
    if (!data?.user || !online)
      return

    queryClient.fetchQuery(syncDatabasesQueryOptions)
    queryClient.fetchQuery(syncChatsQueryOptions)
    queryClient.fetchQuery(syncQueriesQueryOptions)
  }, [data?.user, online])

  useKeyboardEvent(e => e.key === 'n' && (os.type === 'macos' ? e.metaKey : e.ctrlKey), () => {
    router.navigate({ to: '/create' })
  })

  return (
    <>
      <ActionsCenter />
      <Outlet />
    </>
  )
}
