import { getOS } from '@connnect/shared/utils/os'
import { useKeyboardEvent } from '@react-hookz/web'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { fetchDatabases } from '~/entities/database'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

const os = getOS()

export const Route = createFileRoute('/(protected)/_protected')({
  component: LayoutComponent,
})

function LayoutComponent() {
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
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <ActionsCenter />
      <div className="flex flex-1">
        <Outlet />
      </div>
    </motion.div>
  )
}
