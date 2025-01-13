import { Button } from '@connnect/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useSession } from '~/hooks/use-session'
import { authClient, removeBearerToken } from '~/lib/auth'

export const Route = createFileRoute('/(protected)/_dashboard')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { isLoading, data, refetch } = useSession()

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await Promise.all([removeBearerToken(), authClient.signOut()])
      await refetch()
    },
    onSuccess: () => {
      toast.success('Signed out')
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
      <header>
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
