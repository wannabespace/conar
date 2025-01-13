import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AppLogo } from '~/components/app-logo'
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
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-10">
        <div className="flex items-center gap-3">
          <AppLogoGradient className="hidden size-12 dark:block" />
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary dark:hidden">
            <AppLogo className="size-8 text-white" />
          </div>
        </div>
        <AnimatePresence>
          <Outlet />
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
