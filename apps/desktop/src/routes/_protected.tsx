import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useSession } from '~/hooks/use-session'
import { authClient, removeBearerToken } from '~/lib/auth'

export const Route = createFileRoute('/_protected')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { isLoading, data, refetch } = useSession()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      <div className="flex gap-2 p-2">
        <Link to="/" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header>
        {isLoading ? 'Loading...' : data?.user.email || 'No user'}
      </header>
      <button
        type="button"
        onClick={async () => {
          await Promise.all([authClient.signOut(), removeBearerToken()])
          await refetch()
        }}
      >
        Sign Out
      </button>
      <Outlet />
    </motion.div>
  )
}
