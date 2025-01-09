import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { AppLogoGradient } from '~/components/app-logo-gradient'

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
      className="flex min-h-screen items-center justify-center"
    >
      <div className="mx-auto flex max-w-md flex-col gap-10 py-10">
        <div className="flex items-center gap-3">
          <AppLogoGradient className="size-12" />
        </div>
        <Outlet />
      </div>
    </motion.div>
  )
}
