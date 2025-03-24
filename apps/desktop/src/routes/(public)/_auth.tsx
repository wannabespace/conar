import { AppLogo } from '@connnect/ui/components/brand/app-logo'
import { AppLogoGradient } from '@connnect/ui/components/brand/app-logo-gradient'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { SmoothCorner } from '~/components/smooth-corner'

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
      className="flex min-h-screen bg-background items-center justify-center px-3"
    >
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute z-0 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-8 py-6">
        <div className="flex items-center gap-3">
          <AppLogoGradient className="hidden size-12 dark:block" />
          <SmoothCorner radius={12} className="flex size-12 items-center justify-center bg-primary dark:hidden">
            <AppLogo className="size-8 text-white" />
          </SmoothCorner>
        </div>
        <AnimatePresence>
          <Outlet />
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
