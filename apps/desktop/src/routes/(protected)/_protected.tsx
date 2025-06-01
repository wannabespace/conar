import { getOS } from '@connnect/shared/utils/os'
import { useKeyboardEvent } from '@react-hookz/web'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { fetchDatabases } from '~/entities/database'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

const os = getOS()

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

    const interval = setInterval(() => {
      fetchDatabases()
    }, 1000 * 60 * 5)

    return () => clearInterval(interval)
  }, [data?.user])

  useKeyboardEvent(e => e.key === 'n' && (os === 'macos' ? e.metaKey : e.ctrlKey), () => {
    router.navigate({ to: '/create' })
  })

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in zoom-in-[1.2] duration-300 ease-out">
      <ActionsCenter />
      <Outlet />
    </div>
  )
}
