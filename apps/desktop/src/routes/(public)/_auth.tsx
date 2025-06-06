import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { AppLogoGradient } from '@conar/ui/components/brand/app-logo-gradient'
import { DotsBg } from '@conar/ui/components/custom/dots-bg'
import { SmoothCorner } from '@conar/ui/components/custom/smooth-corner'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div
      className="flex min-h-screen bg-background items-center justify-center px-3 animate-in fade-in zoom-in-[1.2] duration-300 ease-out"
    >
      <DotsBg
        className="absolute z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-8 py-6">
        <div className="flex items-center gap-3">
          <AppLogoGradient className="hidden size-12 dark:block" />
          <SmoothCorner radius={12} className="flex size-12 items-center justify-center bg-primary dark:hidden">
            <AppLogo className="size-8 text-white" />
          </SmoothCorner>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
