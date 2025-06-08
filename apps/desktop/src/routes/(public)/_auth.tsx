import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { DotsBg } from '@conar/ui/components/custom/dots-bg'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center px-3">
      <DotsBg
        className="absolute z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-8 py-6">
        <div className="flex items-center gap-3">
          <AppLogoSquare className="size-12" />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
