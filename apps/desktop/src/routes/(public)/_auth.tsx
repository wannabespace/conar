import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { AppLogo } from '~/components/app-logo'

export const Route = createFileRoute('/(public)/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="grid min-h-screen grid-cols-1 lg:grid-cols-2"
    >
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <div className="flex h-full flex-col justify-between space-y-6">
          <div className="flex items-center space-x-2">
            <div className="flex size-7 items-center justify-center rounded bg-black dark:bg-white">
              <AppLogo className="size-5 text-white dark:text-black" />
            </div>
            <span className="font-logo text-2xl font-semibold leading-none [letter-spacing:-0.02em]">connnect</span>
          </div>
          <Outlet />
        </div>
      </div>
      <div className="hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Justd</h2>
            <p className="text-lg">
              made integrating accessible React components into my project
              effortless. The Tailwind CSS support meant I could achieve a
              polished design without breaking a sweat.
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <img
              src="/placeholder.svg?height=40&width=40"
              alt="Avatar"
              className="rounded-full"
              width={40}
              height={40}
            />
            <div className="text-left">
              <div className="text-sm font-medium">Kurt Cobain</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">123</div>
      </div>
    </motion.div>
  )
}
