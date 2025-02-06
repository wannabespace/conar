import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'
import { Navbar } from './-components/navbar'
import { Sidebar } from './-components/sidebar'

export const Route = createFileRoute('/(protected)/_dashboard')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { isAuthenticated } = useSession()

  useEffect(() => {
    if (!isAuthenticated)
      return

    queryClient.prefetchQuery({
      queryKey: ['databases', 'list'],
      queryFn: () => trpc.databases.list.query(),
    })
  }, [isAuthenticated])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      <Navbar />
      <div className="flex h-full">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a database" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-20">
          <Sidebar />
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </motion.div>
  )
}
