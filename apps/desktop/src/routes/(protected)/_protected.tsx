import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { fetchDatabases } from '~/entities/database'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/(protected)/_protected')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { data } = authClient.useSession()

  useEffect(() => {
    if (!data?.user)
      return

    fetchDatabases()

    const interval = setInterval(() => {
      fetchDatabases()
    }, 1000 * 60 * 5)

    return () => clearInterval(interval)
  }, [data?.user])

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
