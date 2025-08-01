import { getOS } from '@conar/shared/utils/os'
import { useKeyboardEvent } from '@react-hookz/web'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { fetchDatabases } from '~/entities/database'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

const os = getOS(navigator.userAgent)

export const Route = createFileRoute('/(protected)/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { data } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!data?.user)
      return

    fetchDatabases()
    // fetchChats()
  }, [data?.user])

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
