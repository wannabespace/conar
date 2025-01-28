import { Button } from '@connnect/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from '~/hooks/use-session'
import { authClient, removeBearerToken } from '~/lib/auth'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'

export const Route = createFileRoute('/(protected)/_dashboard')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { isLoading, data, refetch } = useSession()

  useEffect(() => {
    queryClient.ensureQueryData({
      queryKey: ['databases', 'list'],
      queryFn: () => trpc.databases.list.query(),
    })
  }, [])

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await Promise.all([removeBearerToken(), authClient.signOut()])
      await refetch()
      queryClient.invalidateQueries()
    },
    onSuccess: () => {
      toast.success('You have been signed out successfully.')
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      <div className="flex gap-2 p-2">
        <Link to="/" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header className="bg-background p-2">
        {isLoading ? 'Loading...' : data?.user.email || 'No user'}
      </header>
      <Button
        loading={isSigningOut}
        onClick={() => signOut()}
      >
        Sign Out
      </Button>
      <Outlet />
    </motion.div>
  )
}
